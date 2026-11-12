import { execFileSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { build } from 'vite';
import { createLibraryConfig, createStylesConfig } from '../vite.library.config.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.build.json'], { cwd: root, stdio: 'inherit' });

for (const [entry, fileName] of [
  ['src/index.ts', 'index.js'],
  ['src/core.ts', 'core.js'],
  ['src/define.ts', 'chart.js']
]) {
  await build(createLibraryConfig({ root, entry, fileName, format: fileName === 'chart.js' ? 'iife' : 'es' }));
}
// ESM registration must share the constructors exported by the package root.
await writeFile(resolve(dist, 'define.js'), `export { A11Y_SEGMENTED_BAR_CHART_TAG_NAME, defineA11ySegmentedBarChart } from './index.js';
import { defineA11ySegmentedBarChart } from './index.js';
defineA11ySegmentedBarChart();
`);
await build(createStylesConfig({ root }));
console.log('Built shared-identity segmented-bar ESM entries, standalone browser bundle, declarations, and stylesheet.');
