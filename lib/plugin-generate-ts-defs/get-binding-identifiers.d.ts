import type * as t from '@babel/types';
export { getOuterBindingIdentifiers as default };
/**
 * Return a list of binding identifiers associated with the input `node`.
 */
declare function getOuterBindingIdentifiers(node: t.Node): Record<string, t.Identifier>;
