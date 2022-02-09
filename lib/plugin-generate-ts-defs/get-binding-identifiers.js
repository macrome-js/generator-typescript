"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = void 0;
const types_1 = require("@babel/types");
/**
 * Mapping of types to their identifier keys.
 */
const identifierKeys = {
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
function getOuterBindingIdentifiers(node) {
    let search = [node];
    const ids = Object.create(null);
    while (search.length) {
        const id = search.shift();
        if (!id)
            continue;
        const keys = identifierKeys[id.type];
        if ((0, types_1.isIdentifier)(id)) {
            ids[id.name] = id;
            continue;
        }
        if ((0, types_1.isExportDeclaration)(id) && !(0, types_1.isExportAllDeclaration)(id)) {
            if ((0, types_1.isDeclaration)(id.declaration)) {
                search.push(id.declaration);
            }
            continue;
        }
        if ((0, types_1.isFunctionDeclaration)(id)) {
            search.push(id.id);
            continue;
        }
        if ((0, types_1.isFunctionExpression)(id)) {
            continue;
        }
        if (keys) {
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const value = id[key];
                if (value) {
                    search = search.concat(value);
                }
            }
        }
    }
    // $FlowIssue Object.create() seems broken
    return ids;
}
exports.default = getOuterBindingIdentifiers;
