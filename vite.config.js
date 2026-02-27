import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:8001';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/feedback': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/skills': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/health': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/openrouter/chat/completions': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
})
