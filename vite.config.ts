import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Vital correction for Vercel/Production deployment
      // Prevents "Uncaught ReferenceError: process is not defined"
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Fallback object to prevent crashes if other process.env props are accessed
      'process.env': {}, 
    },
    server: {
      host: true,
      port: 3000,
      strictPort: true,
    },
    preview: {
      port: 3000,
      strictPort: true,
    }
  }
})