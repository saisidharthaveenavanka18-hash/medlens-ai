import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  cacheDir: 'C:/Users/JASHWANTH/.vite_cache/medilanes',
  server: {
    host: true,
    port: 5173,
    cors: true,
    allowedHosts: true,
  },
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  },
});
