import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-server',
      configureServer: async (server) => {
        // Import the API server
        const { default: apiApp } = await import('./server/index.js')
        
        // Use the Express app as middleware for /api routes
        server.middlewares.use('/api', apiApp)
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3002,
    open: true,
  },
  ssr: {
    external: ['langchain', '@langchain/core', '@langchain/google-genai', '@langchain/community'],
    noExternal: []
  },
  optimizeDeps: {
    exclude: ['langchain', '@langchain/core', '@langchain/google-genai']
  },
})
