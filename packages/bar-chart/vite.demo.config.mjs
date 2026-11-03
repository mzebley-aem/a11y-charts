import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));
const entry = fileURLToPath(new URL('./demo/main.ts', import.meta.url));
const outputDirectory = fileURLToPath(new URL('./demo/build', import.meta.url));

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: { cssFileName: 'bar-demo', entry, fileName: () => 'bar-demo.js', formats: ['iife'], name: 'A11yBarChartDemo' },
    outDir: outputDirectory
  },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  root: packageRoot
});
