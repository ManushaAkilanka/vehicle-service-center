import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Expose on all network interfaces so other LAN devices can reach the app.
    // e.g. http://192.168.1.x:5173 from another machine on the same network.
    host: '0.0.0.0',

    proxy: {
      // Proxy all /api/* and /uploads/* requests to the Express backend.
      // This works for both localhost and LAN clients because Vite re-issues
      // the request from the server side (where the backend is always localhost).
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
