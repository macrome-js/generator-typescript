import { BaseGenerator, Change, MapApi, MMatchExpression } from '@macrome/generator';
import { transformAsync as transform } from '@babel/core';
import { basename as getBasename } from 'path';

export type Options = {
  include?: MMatchExpression;
  exclude?: MMatchExpression;
};

class GeneratorTypescript extends BaseGenerator<Options, void> {
  constructor(options: Options) {
    super(options);

    this.include = options.include || ['**/*.ts'];
    this.exclude = options.exclude || ['**/*.d.ts'];
  }

  async map(api: MapApi, change: Change) {
    const basename = getBasename(change.path, 'ts');

    const deps = {
      file: api.read(change.path),
    };

    await api.generate(`./${basename}.js`, deps, async ({ file }) => {
      const result = await transform(file, {
        filename: change.path,
        // prettier-ignore
        presets: [
          '@babel/preset-typescript'
        ],
      });
      return result?.code || null;
    });

    await api.generate(`./${basename}.d.ts`, deps, async ({ file }) => {
      const result = await transform(file, {
        filename: change.path,
        // prettier-ignore
        plugins: [
          './plugin-generate-ts-defs'
        ],
      });
      return result?.code || null;
    });
  }
}

module.exports = GeneratorTypescript;
