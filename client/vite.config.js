import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'; // If this fails, try '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Bisht RO Services',
        short_name: 'Bisht RO',
        description: 'Book RO Repair, Chimney Service & Buy Genuine Spares in Ghaziabad',
        theme_color: '#1d4ed8', // Your Brand Blue
        background_color: '#ffffff',
        display: 'standalone',      // This removes the browser address bar
        orientation: 'portrait',    // Locks app to portrait mode like a real app
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});