import type { Visitor } from '@babel/core';
declare type State = {};
export default function generateTSDefs(): {
    name: string;
    visitor: Visitor<State>;
};
export {};
