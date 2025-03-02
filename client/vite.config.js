import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno según el modo
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/socket.io": {
          target: env.VITE_API_URL, // Usa la variable del .env
          ws: true,
          changeOrigin: true,
        },
        "/api": {
          target: env.VITE_API_URL, // Usa la variable del .env
          changeOrigin: true,
        },
      },
    },
    define: {
      "process.env.VITE_API_URL": JSON.stringify(env.VITE_API_URL),
    },
  };
});
