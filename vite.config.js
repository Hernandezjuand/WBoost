import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      include: [/pdf-lib/, /node_modules/]
    },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          'pdf-utils': ['jspdf', 'html2pdf.js', 'pdf-lib', 'jspdf-autotable'],
          ui: ['@headlessui/react', '@heroicons/react', 'framer-motion'],
        }
      }
    }
  },
  optimizeDeps: {
    include: ['pdf-lib', 'buffer'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
    }
  },
}) 