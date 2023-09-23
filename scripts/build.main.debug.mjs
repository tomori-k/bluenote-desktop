import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/main/main.ts'],
  bundle: true,
  minify: false,
  platform: 'node',
  outdir: 'dist',
  packages: 'external',
  target: 'ES2020',
})
