// @ts-nocheck

import { Foo, Bar } from 'foo';

import 'bork';

import { ContinuationResult, MatchState } from './types';

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

export type ImmutableTree<K, V> = {
  get(key: K): V;
  insert(key: K, value: V): ImmutableTree<K, V>;
  readonly length: number;
};

export declare const createTree: <K, V>(comparator: (a: K, b: K) => number) => ImmutableTree<K, V>;

type Moo = Foo;

export { Moo };

type ExpressionState = {
  type: 'expr';
  expr: Expression;
};
type SuccessState = {
  type: 'success';
  expr: Expression | null;
  captures: Array<Array<string | null>>;
};
type ContinuationState = ContinuationResult;
type State = ExpressionState | ContinuationState | SuccessState;
export declare class Sequence {
  readonly state!: State;
  matchState: MatchState;
  parentExpr: Expression;
  better: Sequence | null;
  worse: Sequence | null;
}

export declare class MyIterable<T> extends Iterable<T> {}

const _: unique symbol = Symbol.for('_');

export class Api {
  private [_]: null;
}

export const plusFour = (arg: number): number => number + 4;
