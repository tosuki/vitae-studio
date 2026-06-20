import { nodeExternalsPlugin } from 'esbuild-node-externals';
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/index.js',
  sourcemap: true,
  plugins: [nodeExternalsPlugin()]
});

console.log('✅ Build completed successfully!');
