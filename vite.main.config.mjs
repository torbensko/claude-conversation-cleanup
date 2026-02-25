import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  ssr: {
    noExternal: true,
    external: ['electron'],
  },
  build: {
    rollupOptions: {
      external: ['electron'],
      input: {
        main: resolve(__dirname, 'electron/main.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash][extname]',
        format: 'cjs',
        inlineDynamicImports: false,
      },
    },
    sourcemap: true,
    watch: null,
    emptyOutDir: false,
    outDir: '.vite/build',
    ssr: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
