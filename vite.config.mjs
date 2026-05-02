import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    // admin.html se copia tal cual hasta que migre a Vue
    viteStaticCopy({
      targets: [
        { src: 'admin.html',           dest: '.' },
        { src: 'assets',               dest: '.' },
        { src: 'assessment-config.js', dest: '.' },
      ],
    }),
  ],
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
        // admin se agrega cuando migre a Vue
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
