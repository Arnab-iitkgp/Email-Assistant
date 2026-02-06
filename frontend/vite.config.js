import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This ensures all routes fallback to index.html for SPA routing
    historyApiFallback: true,
  },
  preview: {
    // Also apply for production preview
    historyApiFallback: true,
  },
})
