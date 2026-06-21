import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const gasUploadUrl = env.VITE_GOOGLE_DRIVE_UPLOAD_URL

  let driveUploadProxy = undefined
  if (gasUploadUrl) {
    try {
      const gasPath = new URL(gasUploadUrl).pathname
      driveUploadProxy = {
        '/api/drive-upload': {
          target: 'https://script.google.com',
          changeOrigin: true,
          secure: true,
          rewrite: () => gasPath,
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
    } catch {
      console.warn('VITE_GOOGLE_DRIVE_UPLOAD_URL no es una URL válida')
    }
  } else {
    driveUploadProxy = {
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
