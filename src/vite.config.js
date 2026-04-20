import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/storage', 'firebase/functions'],
          capacitor: ['@capacitor/core'],
          pdf: ['jspdf'],
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})