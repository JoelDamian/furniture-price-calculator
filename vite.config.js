import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { GOOGLE_DRIVE_UPLOAD_URL } from './src/constants/googleDrive.ts'

// https://vite.dev/config/
export default defineConfig(() => {
  const gasPath = new URL(GOOGLE_DRIVE_UPLOAD_URL).pathname

  const driveUploadProxy = {
    '/api/drive-upload': {
      target: 'https://script.google.com',
      changeOrigin: true,
      secure: true,
      followRedirects: true,
      rewrite: () => gasPath,
      configure: (proxy) => {
        proxy.on('proxyRes', (proxyRes) => {
          const ct = proxyRes.headers['content-type'] || '';
          if (ct.includes('text/html') && proxyRes.statusCode === 200) {
            console.warn(
              '[drive-upload] La respuesta parece HTML. Revisa que la Apps Script esté desplegada como "Cualquier persona".'
            );
          }
        });
      },
    },
    '/api/drive-image': {
      target: 'https://drive.google.com',
      changeOrigin: true,
      secure: true,
      rewrite: (path) => {
        const id = new URL(path, 'http://localhost').searchParams.get('id')
        return `/thumbnail?id=${id}&sz=w800`
      },
    },
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          cleanupOutdatedCaches: true,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    base: './',
    server: {
      proxy: driveUploadProxy,
    },
  }
})
