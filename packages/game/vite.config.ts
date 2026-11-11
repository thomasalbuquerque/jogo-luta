import { defineConfig } from 'vite';

// BASE_PATH vem do workflow de deploy (GitHub Pages serve em /<repo>/).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  // build do jogo (o commit, no deploy): o online só liga dois lados com o mesmo build
  define: { __BUILD_ID__: JSON.stringify(process.env.GITHUB_SHA ?? 'dev') },
  server: { port: 5173 },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
});
