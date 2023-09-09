import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/main/main.ts'],
  bundle: true,
  minify: true,
  platform: 'node',
  outfile: 'dist/main.js',
  packages: 'external',
})