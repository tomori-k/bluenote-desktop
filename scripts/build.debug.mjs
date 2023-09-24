import * as esbuild from 'esbuild'

if (process.argv.length < 3)
  throw new Error('Usage: node build.debug.mjs {main|preload}')

const target = process.argv[2]
const entryPoint =
  target === 'preload' ? 'src/preload/preload.ts' : 'src/main/main.ts'

await esbuild.build({
  entryPoints: [entryPoint],
  bundle: true,
  minify: false,
  platform: 'node',
  outdir: 'dist',
  packages: 'external',
  target: 'ES2020',
  sourcemap: 'inline',
})
