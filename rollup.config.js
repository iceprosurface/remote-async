import typescript from 'rollup-plugin-typescript2';
import sourceMaps from 'rollup-plugin-sourcemaps';
export default {
  input: './src/index.ts',
  plugins: [
    typescript({
      exclude: 'node_modules/**',
      typescript: require('typescript'),
    }),
    sourceMaps(),
  ],
  output: [
    {
      format: 'cjs',
      file: 'lib/remoteAsync.cjs.js',
    },
    {
      format: 'es',
      file: 'lib/remoteAsync.esm.js',
    },
  ],
};
