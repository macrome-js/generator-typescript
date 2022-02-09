module.exports = {
  shouldPrintComment: (val) => /^\s*@/.test(val),
  plugins: ['@babel/plugin-syntax-typescript', '../lib/plugin-generate-ts-defs'],
};
