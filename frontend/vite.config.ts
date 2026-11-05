import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_BE_URL || 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@stream-io')) {
                return 'vendor-stream';
              }
              if (id.includes('@clerk')) {
                return 'vendor-clerk';
              }
              if (id.includes('@excalidraw')) {
                return 'vendor-excalidraw';
              }
              if (id.includes('shiki')) {
                return 'vendor-shiki';
              }
              if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react/')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('@radix-ui')) {
                return 'vendor-radix';
              }
            }
          },
        },
      },
    },
    define: {
      __APP_ENV__: JSON.stringify(mode),
    },
  };
});
