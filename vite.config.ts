/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        injectRegister: false,
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'icons/*.png'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: ['**/node_modules/**/*', '**/logo.png', '**/favicon.png', 'sw.js', 'workbox-*.js'],
          runtimeCaching: [
            // Firebase Auth - NetworkFirst
            {
              urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firebase-auth-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 3600
                }
              }
            },
            // Firestore - NetworkFirst
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firestore-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 86400
                },
                networkTimeoutSeconds: 3
              }
            },
            // Firebase Storage - CacheFirst
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'firebase-storage-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 2592000
                }
              }
            },
            // Google Fonts
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets'
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 31536000
                }
              }
            },
            // API routes - NetworkOnly
            {
              urlPattern: /\/api\/.*/i,
              handler: 'NetworkOnly'
            }
          ],
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 2097152
        },
        devOptions: {
          enabled: false
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './setupTests.ts',
      css: true,
      include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
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
