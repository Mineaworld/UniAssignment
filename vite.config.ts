import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Split Firebase into its own chunk
            'vendor-firebase': [
              'firebase/app',
              'firebase/auth',
              'firebase/firestore',
              'firebase/storage'
            ],
            // Split UI/animation libraries
            'vendor-ui': [
              'framer-motion',
              'recharts'
            ],
            // Split routing
            'vendor-router': [
              'react-router-dom'
            ],
            // Split drag-and-drop
            'vendor-dnd': [
              '@dnd-kit/core',
              '@dnd-kit/sortable',
              '@dnd-kit/utilities'
            ],
            // Split BlockNote editor (lazy loaded)
            'vendor-blocknote': [
              '@blocknote/core',
              '@blocknote/react',
              '@blocknote/mantine'
            ],
          }
        }
      }
    }
  };
});
