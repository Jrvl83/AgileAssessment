import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    // Páginas legacy (admin, assessment, facilitar) se copian tal cual hasta que migren a Vue
    viteStaticCopy({
      targets: [
        { src: 'admin.html',           dest: '.' },
        { src: 'facilitar.html',       dest: '.' },
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
        // admin, facilitar se agregan cuando migren a Vue
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
