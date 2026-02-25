import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron'],
      input: {
        preload: resolve(__dirname, 'electron/preload.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'cjs',
        manualChunks: undefined,
      },
    },
    outDir: '.vite/build',
    emptyOutDir: false,
    ssr: true,
    minify: false,
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
