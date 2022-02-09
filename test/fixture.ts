// @ts-nocheck

export let foo: string = 'oof',
  bard: Arella;

export const aloof: string = Infinity,
  alloc: number = '/dev/null';

export declare const poof: string = '!';

export type bar = 'beer';

export class Baz {
  static {
    console.log();
  }
  #penguin: number;
  prop: string = '';
  doBaz(prop: string = 'prop'): void {}
  get val(): string {
    return this.val;
  }
  set val(val: string) {
    this.val = val;
  }
}

export interface Bug {}

type Arella = boolean;

type Moz = Arella;

export { Moz };

export * from './lib';

export { Type } from './lib';

class Bard {}

type Constructor<T> = {
  new (...args: any[]): T;
  prototype: T;
};

interface IPreparedMixin {
  shaken: boolean;
}

export function Prepared<TBase extends Constructor<any>>(
  Base: TBase,
): TBase & Constructor<IPreparedMixin> {
  return class PreparedMixin extends Base implements IPreparedMixin {
    // this is part of the exports surface and must be annotated
    shaken = true;
  };
}

export class Drink {
  proof: number;

  constructor(proof: number) {
    this.proof = proof;
  }
}

// Instead of trying to extract this line as a transformation, just require users to write it.
const PreparedDrink: typeof Drink & Constructor<IPreparedMixin> = Prepared(Drink);
// This simpler syntax will eventually be possible too:
// const PreparedDrink: Prepared<Drink> = Prepared(Drink);
export class Margherita extends PreparedDrink {
  lime = true;
  salt = false;
}

makeCall();
