import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        admin:      resolve(__dirname, 'admin.html'),
        assessment: resolve(__dirname, 'assessment-agile.html'),
        equipo:     resolve(__dirname, 'equipo.html'),
        reporte:    resolve(__dirname, 'reporte.html'),
        facilitar:  resolve(__dirname, 'facilitar.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@':       resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'shared'),
    },
  },
});
