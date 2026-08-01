import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // Changed 'localhost' to '127.0.0.1' to bypass IPv6 loopback mismatch
        changeOrigin: true,
        secure: false,
      }
    }
  }
})