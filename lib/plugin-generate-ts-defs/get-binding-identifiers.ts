import {
  isExportDeclaration,
  isIdentifier,
  isDeclaration,
  isFunctionDeclaration,
  isFunctionExpression,
  isExportAllDeclaration,
} from '@babel/types';
import type * as t from '@babel/types';

export { getOuterBindingIdentifiers as default };

/**
 * Mapping of types to their identifier keys.
 */
const identifierKeys: { [key: string]: Array<string> } = {
  CatchClause: ['param'],
  LabeledStatement: ['label'],
  UnaryExpression: ['argument'],
  AssignmentExpression: ['left'],

  ImportSpecifier: ['local'],
  ImportNamespaceSpecifier: ['local'],
  ImportDefaultSpecifier: ['local'],
  ImportDeclaration: ['specifiers'],

  ExportSpecifier: ['exported'],
  ExportNamespaceSpecifier: ['exported'],
  ExportDefaultSpecifier: ['exported'],

  FunctionDeclaration: ['id', 'params'],
  FunctionExpression: ['id', 'params'],
  ArrowFunctionExpression: ['params'],
  ObjectMethod: ['params'],
  ClassMethod: ['params'],
  ClassPrivateMethod: ['params'],

  ForInStatement: ['left'],
  ForOfStatement: ['left'],

  ClassDeclaration: ['id'],
  ClassExpression: ['id'],

  RestElement: ['argument'],
  UpdateExpression: ['argument'],

  ObjectProperty: ['value'],

  AssignmentPattern: ['left'],
  ArrayPattern: ['elements'],
  ObjectPattern: ['properties'],

  VariableDeclaration: ['declarations'],
  VariableDeclarator: ['id'],

  TSDeclareFunction: ['id'],
  TSInterfaceDeclaration: ['id'],
  TSTypeAliasDeclaration: ['id'],
  TSEnumDeclaration: ['id'],
  TSImportEqualsDeclaration: ['id'],
  TSParameterProperty: ['parameter'],
  TSModuleDeclaration: ['id'],
  TSNamespaceExportDeclaration: ['id'],

  // These declare "de-facto" identifiers which could never be referenced
  // TSIndexSignature: ["parameters"],
  // TSNamedTupleMember: ["label"],
  // TSCallSignatureDeclaration: ["parameters"],

  // These declare ambient identifiers, but never to the module scope
  // TSEnumMember: ["id"],
  // TSTypeParameter: ["name"],
  // TSInferType: ["typeParameter"],
  // TSMappedType: ["typeParameter"],
};

/**
 * Return a list of binding identifiers associated with the input `node`.
 */
function getOuterBindingIdentifiers(node: t.Node): Record<string, t.Identifier> {
  let search = [node];
  const ids = Object.create(null);

  while (search.length) {
    const id = search.shift();
    if (!id) continue;

    const keys: Array<string> | undefined = identifierKeys[id.type];

    if (isIdentifier(id)) {
      ids[id.name] = id;
      continue;
    }

    if (isExportDeclaration(id) && !isExportAllDeclaration(id)) {
      if (isDeclaration(id.declaration)) {
        search.push(id.declaration);
      }
      continue;
    }

    if (isFunctionDeclaration(id)) {
      search.push(id.id!);
      continue;
    }

    if (isFunctionExpression(id)) {
      continue;
    }

    if (keys) {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = (id as any)[key];
        if (value) {
          search = search.concat(value);
        }
      }
    }
  }

  // $FlowIssue Object.create() seems broken
  return ids;
}
