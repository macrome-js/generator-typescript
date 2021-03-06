import { MMatchExpression } from '@macrome/generator';
export declare type Options = {
    include?: MMatchExpression;
    exclude?: MMatchExpression;
    impls?: boolean;
    defs?: boolean;
};
export declare const asArray: <T>(value: T | T[] | null | undefined) => T[];
