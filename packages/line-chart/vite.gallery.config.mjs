import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
const root = fileURLToPath(new URL('../../demo-gallery/', import.meta.url));
export default defineConfig({
  root,
  base: './',
  server: { host: '127.0.0.1', port: 5191, strictPort: true, fs: { allow: [fileURLToPath(new URL('../../', import.meta.url))] } },
  build: { outDir: fileURLToPath(new URL('../../dist/gallery/', import.meta.url)), emptyOutDir: true },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') }
});
