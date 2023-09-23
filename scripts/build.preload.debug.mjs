import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/preload/preload.ts'],
  bundle: true,
  minify: false,
  platform: 'node',
  outdir: 'dist',
  packages: 'external',
  target: 'ES2020',
})
