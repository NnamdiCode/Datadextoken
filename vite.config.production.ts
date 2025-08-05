import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Production-only Vite config for frontend deployment
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'client/index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'client/src'),
      '@assets': resolve(__dirname, 'attached_assets'),
      '@shared': resolve(__dirname, 'shared')
    }
  },
  root: 'client',
  publicDir: '../public',
  envPrefix: 'VITE_'
})