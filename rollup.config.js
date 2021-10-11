import typescript from 'rollup-plugin-typescript2';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';

const plugins = [
  typescript({
    exclude: 'node_modules/**',
    typescript: require('typescript'),
  }),
  sourceMaps(),
];
const input = './src/index.ts';

export default [
  {
    input,
    plugins,
    output: {
      format: 'cjs',
      file: 'lib/remoteAsync.cjs.js',
    },
  },
  {
    input,
    plugins: [
      ...plugins,
      getBabelOutputPlugin({ presets: [['@babel/env', { modules: 'umd' }]],  allowAllFormats: true, }),
    ],
    output: {
      format: 'umd',
      file: 'lib/remoteAsync.umd.js',

      name: 'remoteAsync',
    },
  },
  {
    input,
    plugins,
    output: {
      format: 'es',
      file: 'lib/remoteAsync.esm.js',
    },
  },
];
