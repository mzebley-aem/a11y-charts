import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { init, parse } from 'es-module-lexer';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const temp = await mkdtemp(join(tmpdir(), 'a11y-segmented-bar-chart-pack-'));
try {
  const packDir = join(temp, 'pack');
  const consumer = join(temp, 'consumer');
  await mkdir(packDir);
  await mkdir(consumer);
  execFileSync('npm', ['pack', '--pack-destination', packDir], { cwd: root, stdio: 'ignore' });
  const archive = join(packDir, (await readdir(packDir)).find((name) => name.endsWith('.tgz')));
  await writeFile(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', archive], { cwd: consumer, stdio: 'ignore' });

  const runtimeSmoke = `
    const core = await import('${manifest.name}/core');
    if (typeof globalThis.HTMLElement !== 'undefined') throw new Error('Expected DOM-free Node.');
    const model = core.buildSegmentedBarModel([{ id: 'smoke', label: 'Smoke', value: 1 }]);
    if (model.total !== 1 || core.buildSegmentedBarXlsx(model)[0] !== 80) throw new Error('Packed core failed.');
  `;
  execFileSync(process.execPath, ['--input-type=module', '-e', runtimeSmoke], { cwd: consumer, stdio: 'inherit' });
  await writeFile(join(consumer, 'smoke.mts'), `
    import { buildSegmentedBarModel, buildSegmentedBarXlsx, type A11ySegmentedBarChartDatum } from '${manifest.name}/core';
    import { A11ySegmentedBarChartElement } from '${manifest.name}';
    import { defineA11ySegmentedBarChart } from '${manifest.name}/define';
    const rows: A11ySegmentedBarChartDatum[] = [{ id: 'x', label: 'X', value: 2 }];
    buildSegmentedBarXlsx(buildSegmentedBarModel(rows));
    void A11ySegmentedBarChartElement; void defineA11ySegmentedBarChart;
  `);
  execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '--strict', '--noEmit', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', 'smoke.mts'], { cwd: consumer, stdio: 'inherit' });

  const dist = join(consumer, 'node_modules', ...manifest.name.split('/'), 'dist');
  for (const name of ['index.js', 'core.js', 'define.js', 'chart.js', 'styles.css']) {
    await readFile(join(dist, name));
  }
  const javascript = await Promise.all(['index.js', 'core.js', 'define.js', 'chart.js'].map((name) => readFile(join(dist, name), 'utf8')));
  await init;
  for (const source of javascript) {
    const [imports] = parse(source);
    for (const item of imports) {
      if (!item.n.startsWith('.') && !item.n.startsWith('/')) throw new Error(`Packed artifact has a bare runtime import: ${item.n}`);
    }
  }
  console.log(`Packed ${manifest.name}: core runtime, declarations, standalone JS, and CSS verified.`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
