import { defineConfig } from 'vite';

// BASE_PATH vem do workflow de deploy (GitHub Pages serve em /<repo>/).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  server: { port: 5173 },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
});
