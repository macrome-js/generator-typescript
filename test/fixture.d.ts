// @ts-nocheck
import { Foo } from 'foo';
import { ContinuationResult, MatchState } from './types';
export declare let foo: string, bard: Arella;
export declare const aloof: string, alloc: number;
export declare const poof: string;
export type bar = 'beer';
export declare class Baz {
  #private;
  prop: string;
  doBaz(prop: string): void;
  get val(): string;
  set val(val: string);
}
export interface Bug {}
type Arella = boolean;
type Moz = Arella;
export type { Moz };
export * from './lib';
export type { Type } from './lib';
type Constructor<T> = {
  new (...args: any[]): T;
  prototype: T;
};
interface IPreparedMixin {
  shaken: boolean;
}
export declare function Prepared<TBase extends Constructor<any>>(Base: TBase): TBase & Constructor<IPreparedMixin>;
export declare class Drink {
  proof: number;
  constructor(proof: number);
}
export declare class Margherita extends PreparedDrink {}
export type ImmutableTree<K, V> = {
  get(key: K): V;
  insert(key: K, value: V): ImmutableTree<K, V>;
  readonly length: number;
};
export declare const createTree: <K, V>(comparator: (a: K, b: K) => number) => ImmutableTree<K, V>;
type Moo = Foo;
export type { Moo };
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
  state: State;
  matchState: MatchState;
  parentExpr: Expression;
  better: Sequence | null;
  worse: Sequence | null;
}
