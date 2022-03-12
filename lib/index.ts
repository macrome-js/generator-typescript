import { BaseGenerator, Change, MapApi, MMatchExpression } from '@macrome/generator';
import { transformAsync as transform } from '@babel/core';
import { basename as getBasename } from 'path';

export type Options = {
  include?: MMatchExpression;
  exclude?: MMatchExpression;
  impls?: boolean;
  defs?: boolean;
};

export const asArray = <T>(value: T | null | undefined | Array<T>): Array<T> =>
  value == null ? [] : Array.isArray(value) ? value : [value];

class GeneratorTypescript extends BaseGenerator<Options, void> {
  constructor(options: Options) {
    super({
      impls: true,
      defs: true,
      ...options,
    });

    this.include = options.include ? asArray(options.include) : ['**/*.ts'];
    this.exclude = [...(asArray(options.exclude) || []), '**/*.d.ts'];
  }

  async map(api: MapApi, change: Change) {
    const { options } = this;
    const basename = getBasename(change.path, '.ts');

    const deps = {
      file: api.read(change.path),
    };

    if (options.impls) {
      await api.generate(`./${basename}.js`, deps, async ({ file }) => {
        const result = await transform(file, {
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
        return result?.code || null;
      });
    }

    if (options.defs) {
      await api.generate(`./${basename}.d.ts`, deps, async ({ file }) => {
        const result = await transform(file, {
          filename: change.path,
          plugins: [
            'babel-plugin-recast',
            '@babel/plugin-syntax-typescript',
            `${__dirname}/plugin-generate-ts-defs`,
          ],
        });
        return result?.code || null;
      });
    }
  }
}

module.exports = GeneratorTypescript;
