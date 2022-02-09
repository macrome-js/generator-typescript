// @ts-nocheck
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