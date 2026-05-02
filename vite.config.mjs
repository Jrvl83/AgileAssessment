import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    commonjsOptions: {
      include: [/assessment-config\.js$/, /node_modules/],
    },
    rollupOptions: {
      input: {
        equipo:     resolve(__dirname, 'equipo.html'),
        reporte:    resolve(__dirname, 'reporte.html'),
        assessment: resolve(__dirname, 'assessment-agile.html'),
        facilitar:  resolve(__dirname, 'facilitar.html'),
        admin:      resolve(__dirname, 'admin.html'),
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
