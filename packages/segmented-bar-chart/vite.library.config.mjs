import { resolve } from 'node:path';

export function createLibraryConfig({ root, entry, fileName, format }) {
  const output = { format, entryFileNames: fileName };
  if (format === 'iife') output.name = 'A11ySegmentedBarChart';
  return {
    configFile: false,
    root,
    logLevel: 'warn',
    build: {
      target: 'es2022',
      outDir: resolve(root, 'dist'),
      emptyOutDir: false,
      lib: {
        entry: resolve(root, entry),
        formats: [format],
        name: 'A11ySegmentedBarChart',
        fileName: () => fileName
      },
      rollupOptions: { external: [], output }
    }
  };
}

export function createStylesConfig({ root }) {
  return {
    configFile: false,
    root,
    logLevel: 'warn',
    build: {
      outDir: resolve(root, 'dist'),
      emptyOutDir: false,
      cssCodeSplit: true,
      rollupOptions: {
        input: resolve(root, 'src/styles.css'),
        output: { assetFileNames: 'styles.css' }
      }
    }
  };
}
