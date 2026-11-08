import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite config — deployment ready for Vercel / Netlify / any static host.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Allow proxied preview hosts (e.g. *.e2b.app) so live preview works.
    allowedHosts: true,
    strictPort: false,
  },
  build: {
    // Split the big, rarely-changing vendors so the app shell loads fast on 3G.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          maps: ['leaflet', 'react-leaflet'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
});
