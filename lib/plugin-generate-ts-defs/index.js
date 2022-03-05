"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const errawr_1 = require("errawr");
const t = __importStar(require("@babel/types"));
const queue_1 = __importDefault(require("@iter-tools/queue"));
// @ts-ignore
const tScope = __importStar(require("babel-type-scopes"));
const get_binding_identifiers_1 = __importDefault(require("./get-binding-identifiers"));
function stripRuntime(node) {
    let declaration = node;
    if (t.isVariableDeclaration(declaration)) {
        const declarators = declaration.declarations;
        for (const declarator of declarators) {
            declarator.init = undefined;
            declaration.declare = true;
        }
    }
    else if (t.isFunctionDeclaration(declaration)) {
        const { id, params, typeParameters, returnType } = declaration;
        // These node types are for Flow not Typescript
        // prettier-ignore
        if ((typeParameters === null || typeParameters === void 0 ? void 0 : typeParameters.type) === 'TypeParameterDeclaration')
            throw new Error('Unexpected TypeParameterDeclaration');
        if ((returnType === null || returnType === void 0 ? void 0 : returnType.type) === 'TypeAnnotation')
            throw new Error('Unexpected TypeAnnotation');
        declaration = t.tsDeclareFunction(id, typeParameters, params, returnType);
        declaration.declare = true;
    }
    else if (t.isClassDeclaration(declaration)) {
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
                if (t.isMemberExpression(member.key)) {
                    // [Symbol.iterator]()
                }
            }
            else if (t.isClassMethod(member)) {
                const { decorators, key, typeParameters, params, returnType, kind } = member;
                (0, errawr_1.invariant)(!t.isTypeParameterDeclaration(typeParameters), 'Unexpected TypeParameterDeclaration');
                (0, errawr_1.invariant)(!t.isTypeAnnotation(returnType), 'Unexpected TypeAnnotation');
                for (let i = 0; i < params.length; i++) {
                    let param = params[i];
                    if (t.isAssignmentPattern(param)) {
                        // TODO when do these occur?
                        (0, errawr_1.invariant)(t.isIdentifier(param.left), 'Unexpected non-identifier left of AssignmentPattern');
                        params[i] = param = param.left;
                    }
                }
                member = body.body[i] = t.tsDeclareMethod(decorators, key, typeParameters, params, returnType);
                member.kind = kind;
            }
            else if (t.isClassAccessorProperty(member)) {
                // What does this mean...
            }
            else if (t.isClassPrivateMethod(member) || t.isClassPrivateProperty(member)) {
                body.body.splice(i, 1);
                hasPrivates = true;
            }
            else if (t.isStaticBlock(member)) {
                body.body.splice(i, 1);
            }
        }
        if (hasPrivates) {
            // TS does this to keep private props hidden while preventing duck-typing
            body.body.unshift(t.classPrivateProperty(t.privateName(t.identifier('private')), undefined, undefined, false));
        }
        declaration.decorators = undefined;
        declaration.declare = true;
    }
    return declaration;
}
const leftmost = (l) => {
    let left = l;
    while (left && t.isTSQualifiedName(left))
        left = left.left;
    // t.assertIdentifier(left);
    return left;
};
const getExportedNames = (node) => {
    let names = [];
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
            names.push(...Object.keys((0, get_binding_identifiers_1.default)(node.declaration)));
        }
    }
    return names;
};
function generateTSDefs() {
    const visitor = {
        Program(path) {
            var _a, _b, _c;
            const { body } = path.node;
            // Find exported symbols
            // Build set of used symbols:
            // Create a queue and a used set
            // Initialize queue and used set with exported symbols
            // For items in queue, traverse to find nested TSTypeReference and TSTypeQuery
            //   if this is a reference to the global scope (runtime or ambient) add it to the queue and used set and recurse
            // Eliminate definitions of identifiers not in the used set.
            const moduleScope = path.scope;
            const moduleTypeBindings = tScope.getOwnTypeBindings(path);
            const exportedNames = body.flatMap((node) => getExportedNames(node));
            const queue = new queue_1.default(exportedNames);
            const usedSet = new Set();
            for (const name of queue) {
                if (usedSet.has(name))
                    continue;
                const boundPath = ((_a = moduleScope.getOwnBinding(name)) === null || _a === void 0 ? void 0 : _a.path) || ((_b = moduleTypeBindings[name]) === null || _b === void 0 ? void 0 : _b.path);
                if (!boundPath)
                    continue;
                // invariant(boundPath, `Unable to find binding in scope for {name: '${name}'}`);
                usedSet.add(name);
                // Ensure that any unexported names that are referenced are still counted as used
                (_c = boundPath.parentPath) === null || _c === void 0 ? void 0 : _c.traverse({
                    TSTypeReference(path) {
                        var _a, _b;
                        const { name } = leftmost(path.node.typeName);
                        if (((_a = tScope.getTypeBinding(path, name)) === null || _a === void 0 ? void 0 : _a.path.scope) === moduleScope ||
                            ((_b = path.scope.getBinding(name)) === null || _b === void 0 ? void 0 : _b.scope) === moduleScope) {
                            queue.push(name);
                        }
                    },
                    TSTypeQuery(path) {
                        var _a, _b;
                        const { exprName } = path.node;
                        if (t.isTSEntityName(exprName)) {
                            const { name } = leftmost(exprName);
                            if (((_a = tScope.getTypeBinding(path, name)) === null || _a === void 0 ? void 0 : _a.path.scope) === moduleScope ||
                                ((_b = path.scope.getBinding(name)) === null || _b === void 0 ? void 0 : _b.scope) === moduleScope) {
                                queue.push(name);
                            }
                        }
                    },
                    // @ts-ignore
                    // Scope(path) {
                    //   path.skip();
                    // },
                });
            }
            for (const [key, binding] of Object.entries(moduleScope.bindings)) {
                if (!usedSet.has(key)) {
                    binding.path.remove();
                }
                else {
                    //   stmt.exportKind = 'type';
                }
            }
            for (let i = body.length - 1; i >= 0; i--) {
                const stmt = body[i];
                if (t.isExportNamedDeclaration(stmt)) {
                    if (stmt.declaration) {
                        stmt.declaration = stripRuntime(stmt.declaration);
                    }
                    stmt.exportKind = 'type';
                }
                else if (t.isExportAllDeclaration(stmt)) {
                }
                else {
                    const shouldRemove = !Object.keys((0, get_binding_identifiers_1.default)(stmt)).length;
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
exports.default = generateTSDefs;
