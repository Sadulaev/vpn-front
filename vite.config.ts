import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    allowedHosts: [
      'sub.hyper-vpn.ru'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        // Admin panel: served at /admin/
        main: resolve(__dirname, 'index.html'),
        // Telegram Mini App: served at /app/
        app: resolve(__dirname, 'app/index.html'),
      },
    },
  },
})
