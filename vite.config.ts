import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    server: {
      port: 5177,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5001',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt', // Changed to prompt to allow AppUpdater control
        includeAssets: ['icons/*.png'],
        manifest: {
          name: 'المصطبة العلمية',
          short_name: 'المصطبة',
          description: 'منصة معرفية شاملة للشباب المسلم للدورات الإسلامية الصوتية والمرئية',
          theme_color: '#0f3d36', // Aligned with the dark green theme
          background_color: '#0f3d36',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          orientation: 'portrait-primary',
          categories: ['education', 'lifestyle', 'productivity'],
          start_url: '/',
          id: '/',
          lang: 'ar',
          dir: 'rtl',
          shortcuts: [
            {
              name: 'مكتبة المصطبة',
              short_name: 'المكتبة',
              description: 'الوصول لمكتبة المصطبة العلمية',
              url: '/library',
              icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'البحث الشامل',
              short_name: 'البحث',
              description: 'البحث عن الدورات والمحتوى',
              url: '/search',
              icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
            }
          ],
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          screenshots: [
            {
              src: 'https://raw.githubusercontent.com/NinjaWorld1234/Files/main/muslim_youth_forum_landing_page.png',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide',
              label: 'الرئيسية'
            },
            {
              src: 'https://raw.githubusercontent.com/NinjaWorld1234/Files/main/Dark.png',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide',
              label: 'لوحة التحكم'
            }
          ]
        },
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          importScripts: ['/push-sw.js'],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unsplash-images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
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
    }
  };
});

