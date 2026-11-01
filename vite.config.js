import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiProxy = { '/api': { target: process.env.EXPORT_SERVER_URL || 'http://127.0.0.1:4318' } }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
})
