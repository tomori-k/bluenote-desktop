import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  root: 'src/renderer',
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  css: { postcss: './src/renderer/' },
})
