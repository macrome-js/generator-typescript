import { invariant } from 'errawr';
import type { Visitor } from '@babel/core';
import * as t from '@babel/types';
import Queue from '@iter-tools/queue';
// @ts-ignore
import * as tScope from 'babel-type-scopes';
import getOuterBindingIdentifiers from './get-binding-identifiers';

type State = {};

function stripRuntime<T>(node: T): T;
function stripRuntime(node: t.Node): t.Node {
  let declaration = node;

  if (t.isVariableDeclaration(declaration)) {
    const declarators = declaration.declarations;
    for (const declarator of declarators) {
      if (
        declarator.init &&
        t.isArrowFunctionExpression(declarator.init) &&
        t.isIdentifier(declarator.id) &&
        !declarator.id.typeAnnotation
      ) {
        // const fn = (arg: type): type => result;
        // In this case we wish to infer
        const arrowFn = declarator.init;
        const { typeParameters, params, returnType } = arrowFn;

        if (typeParameters) {
          invariant(
            typeParameters?.type === 'TSTypeParameterDeclaration',
            'Invalid type parameters',
          );
        }
        invariant(returnType?.type === 'TSTypeAnnotation', 'Invalid return type annotation');

        const params_ = params.map((param) => {
          if (t.isPattern(node)) {
            throw new Error('argument Patterns are unsupported');
          } else {
            return param as t.Identifier | t.RestElement;
          }
        });

        declarator.id.typeAnnotation = t.tsTypeAnnotation(
          t.tsFunctionType(typeParameters, params_, returnType),
        );
      }
      declarator.init = undefined;
      declaration.declare = true;
    }
  } else if (t.isFunctionDeclaration(declaration)) {
    const { id, params, typeParameters, returnType } = declaration;

    // These node types are for Flow not Typescript
    // prettier-ignore
    if (typeParameters?.type === 'TypeParameterDeclaration') throw new Error('Unexpected TypeParameterDeclaration');
    if (returnType?.type === 'TypeAnnotation') throw new Error('Unexpected TypeAnnotation');

    declaration = t.tsDeclareFunction(id, typeParameters, params, returnType);
    declaration.declare = true;
  } else if (t.isClassDeclaration(declaration)) {
    const { body } = declaration;
    // At present it is safe to assume that TS decorators never mutate method types
    // https://github.com/microsoft/TypeScript/issues/4881

    let hasPrivates = false;
    for (let i = body.body.length - 1; i >= 0; i--) {
      let member = body.body[i];

      if (t.isClassProperty(member)) {
        member.value = undefined;
        member.definite = false;

        if (!member.typeAnnotation) {
          body.body.splice(i, 1);
        }

        if (member.accessibility === 'private') {
          member.typeAnnotation = null;
        }

        if (t.isIdentifier(member.key)) {
          // [Symbol.iterator]()
        }
      } else if (t.isClassMethod(member)) {
        const { decorators, key, typeParameters, params, returnType, kind } = member;

        invariant(
          !t.isTypeParameterDeclaration(typeParameters),
          'Unexpected TypeParameterDeclaration',
        );
        invariant(!t.isTypeAnnotation(returnType), 'Unexpected TypeAnnotation');

        for (let i = 0; i < params.length; i++) {
          let param = params[i];
          if (t.isAssignmentPattern(param)) {
            // TODO when do these occur?
            invariant(
              t.isIdentifier(param.left),
              'Unexpected non-identifier left of AssignmentPattern',
            );
            params[i] = param = param.left;
          }
        }

        member = body.body[i] = t.tsDeclareMethod(
          decorators,
          key,
          typeParameters,
          params,
          returnType,
        );
        member.kind = kind;
      } else if (t.isClassAccessorProperty(member)) {
        // What does this mean...
      } else if (t.isClassPrivateMethod(member) || t.isClassPrivateProperty(member)) {
        body.body.splice(i, 1);
        hasPrivates = true;
      } else if (t.isStaticBlock(member)) {
        body.body.splice(i, 1);
      }
    }
    if (hasPrivates) {
      // TS does this to keep private props hidden while preventing duck-typing
      body.body.unshift(
        t.classPrivateProperty(t.privateName(t.identifier('private')), undefined, undefined, false),
      );
    }
    declaration.decorators = undefined;
    declaration.declare = true;
  }
  return declaration;
}

const getExportedNames = (node: t.Node): Array<string> => {
  let names: Array<string> = [];
  if (t.isExportNamedDeclaration(node)) {
    for (const spec of node.specifiers) {
      if (t.isExportSpecifier(spec)) {
        const { local } = spec;
        names.push(local.name);
      }
    }
  }
  if (t.isExportNamedDeclaration(node) || t.isExportDefaultDeclaration(node)) {
    if (node.declaration) {
      names.push(...Object.keys(getOuterBindingIdentifiers(node.declaration)));
    }
  }
  return names;
};

export default function generateTSDefs() {
  const visitor: Visitor<State> = {
    Program(path) {
      const { body } = path.node;

      // First strip out runtime code
      // This will make it easier to analyze any remaining identifiers

      for (let i = body.length - 1; i >= 0; i--) {
        let stmt = body[i];

        if (t.isExportNamedDeclaration(stmt)) {
          if (stmt.declaration) {
            stmt.declaration = stripRuntime(stmt.declaration);
          }

          stmt.exportKind = 'type';
        } else if (t.isExportAllDeclaration(stmt)) {
        } else {
          body[i] = stmt = stripRuntime(stmt);
          const shouldRemove = !Object.keys(getOuterBindingIdentifiers(stmt)).length;
          if (shouldRemove) {
            body.splice(i, 1);
          }
        }
      }

      // Find exported symbols
      // Build set of used symbols:
      // Create a queue and a used set
      // Initialize queue and used set with exported symbols
      // For items in queue, traverse to find nested TSTypeReference and TSTypeQuery
      //   if this is a reference to the global scope (runtime or ambient) add it to the queue and used set and recurse
      // Eliminate definitions of identifiers not in the used set.

      const moduleScope = path.scope;
      const moduleTypeBindings: { [name: string]: { kind: string; path: any } } =
        tScope.getOwnTypeBindings(path);

      const exportedNames = body.flatMap((node) => getExportedNames(node));
      const queue = new Queue(exportedNames);
      const usedSet = new Set();

      for (const name of queue) {
        if (usedSet.has(name)) continue;

        const boundPath = moduleScope.getOwnBinding(name)?.path || moduleTypeBindings[name]?.path;

        if (!boundPath) continue;
        // invariant(boundPath, `Unable to find binding in scope for {name: '${name}'}`);

        usedSet.add(name);

        // Ensure that any unexported names that are referenced are still counted as used
        boundPath.parentPath?.traverse({
          Identifier(path) {
            const { node } = path;
            const parentNode = path.parentPath.node;
            if (
              (t.isTSQualifiedName(parentNode) && parentNode.left !== node) ||
              t.isImportSpecifier(parentNode) ||
              t.isImportDefaultSpecifier(parentNode)
            ) {
              return;
            }
            const { name } = node;
            if (
              tScope.getTypeBinding(path, name)?.path?.scope === moduleScope ||
              path.scope.getBinding(name)?.scope === moduleScope
            ) {
              queue.push(name);
            }
          },
          // @ts-ignore
          // Scope(path) {
          //   path.skip();
          // },
        } as Visitor);
      }

      for (const [key, binding] of Object.entries(moduleScope.bindings)) {
        if (!usedSet.has(key)) {
          binding.path.remove();
        } else {
          //   stmt.exportKind = 'type';
        }
      }

      for (let i = body.length - 1; i >= 0; i--) {
        let stmt = body[i];

        if (t.isImportDeclaration(stmt)) {
          if (!stmt.specifiers.length) {
            body.splice(i, 1);
          }
        }
      }
    },
  };

  return {
    name: 'generate-ts-defs',
    visitor,
  };
}
