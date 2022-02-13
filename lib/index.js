"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generator_1 = require("@macrome/generator");
const core_1 = require("@babel/core");
const path_1 = require("path");
class GeneratorTypescript extends generator_1.BaseGenerator {
    constructor(options) {
        super(options);
        this.include = options.include || ['**/*.ts'];
        this.exclude = options.exclude || ['**/*.d.ts'];
    }
    async map(api, change) {
        const basename = (0, path_1.basename)(change.path, 'ts');
        const deps = {
            file: api.read(change.path),
        };
        await api.generate(`./${basename}.js`, deps, async ({ file }) => {
            const result = await (0, core_1.transformAsync)(file, {
                filename: change.path,
                // prettier-ignore
                presets: [
                    '@babel/preset-typescript'
                ],
            });
            return (result === null || result === void 0 ? void 0 : result.code) || null;
        });
        await api.generate(`./${basename}.d.ts`, deps, async ({ file }) => {
            const result = await (0, core_1.transformAsync)(file, {
                filename: change.path,
                // prettier-ignore
                plugins: [
                    './plugin-generate-ts-defs'
                ],
            });
            return (result === null || result === void 0 ? void 0 : result.code) || null;
        });
    }
}
module.exports = GeneratorTypescript;
