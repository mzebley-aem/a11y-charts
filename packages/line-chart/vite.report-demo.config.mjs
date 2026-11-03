import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));
const reportDemo = fileURLToPath(new URL('./demo/report-demo.html', import.meta.url));
const outputDirectory = fileURLToPath(new URL('./demo/report-build', import.meta.url));

export default defineConfig({
  base: './',
  build: {
    emptyOutDir: true,
    outDir: outputDirectory,
    rollupOptions: {
      input: reportDemo
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  root: packageRoot
});
