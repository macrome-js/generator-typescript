import { invariant } from 'errawr';
import type { Visitor } from '@babel/core';
import * as t from '@babel/types';
import Queue from '@iter-tools/queue';
// @ts-ignore
import * as tScope from 'babel-type-scopes';
import getOuterBindingIdentifiers from './get-binding-identifiers';

type State = {};

function stripRuntime(node: t.Declaration): t.Declaration;
function stripRuntime(node: t.Node): t.Node;
function stripRuntime(node: t.Node): t.Node {
  let declaration = node;

  if (t.isVariableDeclaration(declaration)) {
    const declarators = declaration.declarations;
    for (const declarator of declarators) {
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
    const { id, superClass, body } = declaration;
    // At present it is safe to assume that TS decorators never mutate method types
    // https://github.com/microsoft/TypeScript/issues/4881
    const decorators = undefined;
    let hasPrivates = false;
    for (let i = body.body.length - 1; i >= 0; i--) {
      let member = body.body[i];

      if (t.isClassProperty(member)) {
        member.value = undefined;

        if (!member.typeAnnotation) {
          body.body.splice(i, 1);
        }

        if (t.isMemberExpression(member.key)) {
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
    declaration = t.classDeclaration(id, superClass, body, decorators);
    declaration.declare = true;
  }
  return declaration;
}

const leftmost = (l: t.TSEntityName): t.Identifier => {
  let left: t.TSQualifiedName | t.Identifier = l;
  while (left && t.isTSQualifiedName(left)) left = left.left;
  // t.assertIdentifier(left);
  return left;
};

export default function generateTSDefs() {
  const visitor: Visitor<State> = {
    Program(path) {
      const { body } = path.node;

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
      const exportedNames = body
        .filter((node) => t.isExportNamedDeclaration(node))
        .flatMap((node) => Object.keys(getOuterBindingIdentifiers(node)));
      const queue = new Queue(exportedNames);
      const usedSet = new Set();

      for (const name of queue) {
        const boundPath = moduleScope.getOwnBinding(name)?.path || moduleTypeBindings[name]?.path;

        if (!boundPath) continue;
        // invariant(boundPath, `Unable to find binding in scope for {name: '${name}'}`);

        usedSet.add(name);

        // Ensure that any unexported names that are referenced are still counted as used
        boundPath.parentPath?.traverse({
          TSTypeReference(path) {
            const { name } = leftmost(path.node.typeName);
            if (boundPath.scope.getBinding(name)?.scope === moduleScope && !usedSet.has(name)) {
              queue.push(name);
            }
          },
          TSTypeQuery(path) {
            const { exprName } = path.node;
            if (t.isTSEntityName(exprName)) {
              const { name } = leftmost(exprName);
              if (boundPath.scope.getBinding(name)?.scope === moduleScope && !usedSet.has(name)) {
                queue.push(name);
              }
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

      // TODO Eliminate unused imports

      for (let i = body.length - 1; i >= 0; i--) {
        const stmt = body[i];

        if (t.isExportNamedDeclaration(stmt)) {
          if (stmt.declaration) {
            stmt.declaration = stripRuntime(stmt.declaration);
          }

          stmt.exportKind = 'type';
        } else if (t.isExportAllDeclaration(stmt)) {
        } else {
          const shouldRemove = !Object.keys(getOuterBindingIdentifiers(stmt)).length;
          if (shouldRemove) {
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
