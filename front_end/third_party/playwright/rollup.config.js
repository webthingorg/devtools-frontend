const cjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const json = require('@rollup/plugin-json');

export default [
  {
    input: 'main.js',
    output: {
      file: 'playwright.built.js',
      format: 'es',
    },
    plugins: [nodeResolve({
      module: true,
      moduleDirectories: ['./node_modules'],
      browser: true,
      jsnext: true
    }), cjs({
      include: ['./main.js', /node_modules/]
    }), json()],
  },
];
