// html/vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        panel:   resolve(__dirname, 'panel.html'),
        config:  resolve(__dirname, 'config.html'),
        overlay: resolve(__dirname, 'video_overlay.html'),
      }
    }
  }
});
