import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { build } from 'vite';
import { createLibraryConfig, createStylesConfig } from '../vite.library.config.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.build.json'], { cwd: root, stdio: 'inherit' });
// rollup-plugin-dts requires the compiler API that TS 7 moved to @typescript/typescript6.
execFileSync(process.execPath, [resolve(root, 'scripts/bundle-types.mjs')], { cwd: root, stdio: 'inherit' });
await rm(resolve(dist, 'types/line-chart/src'), { recursive: true, force: true });
await rm(resolve(dist, 'types/chart-core'), { recursive: true, force: true });

for (const [entry, fileName] of [
  ['src/index.ts', 'index.js'],
  ['src/core.ts', 'core.js'],
  ['src/define.ts', 'chart.js']
]) {
  await build(createLibraryConfig({ root, entry, fileName, format: fileName === 'chart.js' ? 'iife' : 'es' }));
}
// ESM registration must share the constructors exported by the package root.
await writeFile(resolve(dist, 'define.js'), `export { A11Y_LINE_CHART_TAG_NAME, defineA11yLineChart } from './index.js';
import { defineA11yLineChart } from './index.js';
defineA11yLineChart();
`);
await build(createStylesConfig({ root }));
const licenses = [
  ['node_modules/echarts/LICENSE', 'ECHARTS-LICENSE'],
  ['node_modules/echarts/NOTICE', 'ECHARTS-NOTICE'],
  ['node_modules/echarts/licenses/LICENSE-d3', 'ECHARTS-LICENSE-d3'],
  ['node_modules/zrender/LICENSE', 'ZRENDER-LICENSE'],
  ['node_modules/tslib/LICENSE.txt', 'TSLIB-LICENSE']
];
for (const [source, target] of licenses) {
  await copyFile(resolve(root, source), resolve(dist, target));
}
console.log('Built shared-identity line ESM entries, standalone browser bundle, declarations, and stylesheet.');
