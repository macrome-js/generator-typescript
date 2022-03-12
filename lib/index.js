"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asArray = void 0;
const generator_1 = require("@macrome/generator");
const core_1 = require("@babel/core");
const path_1 = require("path");
const asArray = (value) => value == null ? [] : Array.isArray(value) ? value : [value];
exports.asArray = asArray;
class GeneratorTypescript extends generator_1.BaseGenerator {
    constructor(options) {
        super(Object.assign({ impls: true, defs: true }, options));
        this.include = options.include ? (0, exports.asArray)(options.include) : ['**/*.ts'];
        this.exclude = [...((0, exports.asArray)(options.exclude) || []), '**/*.d.ts'];
    }
    async map(api, change) {
        const { options } = this;
        const basename = (0, path_1.basename)(change.path, '.ts');
        const deps = {
            file: api.read(change.path),
        };
        if (options.impls) {
            await api.generate(`./${basename}.js`, deps, async ({ file }) => {
                const result = await (0, core_1.transformAsync)(file, {
                    filename: change.path,
                    // prettier-ignore
                    presets: [
                        '@babel/preset-typescript',
                    ],
                    // prettier-ignore
                    plugins: [
                        'babel-plugin-recast',
                        '@babel/plugin-transform-modules-commonjs',
                    ],
                    shouldPrintComment: (val) => !/^\s*@ts/.test(val),
                });
                return (result === null || result === void 0 ? void 0 : result.code) || null;
            });
        }
        if (options.defs) {
            await api.generate(`./${basename}.d.ts`, deps, async ({ file }) => {
                const result = await (0, core_1.transformAsync)(file, {
                    filename: change.path,
                    plugins: [
                        'babel-plugin-recast',
                        '@babel/plugin-syntax-typescript',
                        `${__dirname}/plugin-generate-ts-defs`,
                    ],
                });
                return (result === null || result === void 0 ? void 0 : result.code) || null;
            });
        }
    }
}
module.exports = GeneratorTypescript;
