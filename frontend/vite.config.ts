import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '../components/section': path.resolve(__dirname, './src/Components/Section'),
      '../components/heading': path.resolve(__dirname, './src/Components/Heading'),
      '../components/form': path.resolve(__dirname, './src/Components/Form'),
      '../components/button': path.resolve(__dirname, './src/Components/Button'),
      '../components': path.resolve(__dirname, './src/Components'),
      '../Components': path.resolve(__dirname, './src/Components'),
    },
    preserveSymlinks: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})