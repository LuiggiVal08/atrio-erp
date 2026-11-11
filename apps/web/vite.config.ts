/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  cacheDir: path.resolve(__dirname, `node_modules/.vite-${process.getuid?.() ?? 'user'}`),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['axios', '@tanstack/react-query'],
          'vendor-ui': ['@heroui/react', 'framer-motion', 'lucide-react'],
          'vendor-charts': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 750,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          // Surface API restarts as 503 instead of resetting the browser connection.
          proxy.on('error', (_err, _req, res) => {
            if ('writeHead' in res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'API no disponible', statusCode: 503 }));
            }
          });
        },
      },
      '/ws': {
        target: process.env.VITE_WS_PROXY || 'ws://localhost:3000',
        ws: true,
      },
      '/uploads': {
        target: process.env.VITE_API_PROXY || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.spec.{ts,tsx}'],
    exclude: ['tests/usability/**', 'node_modules/**'],
  },
});
