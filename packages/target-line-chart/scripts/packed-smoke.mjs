import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { init, parse } from 'es-module-lexer';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const temp = await mkdtemp(join(tmpdir(), 'a11y-target-line-chart-pack-'));
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
    if (typeof globalThis.HTMLElement !== 'undefined') throw new Error('Expected a DOM-free Node process.');
    if (typeof core.resolveConfig !== 'function' || typeof core.buildSemanticModel !== 'function') throw new Error('Missing packed core exports.');
    if (!core.validateData([{ x: 'smoke', actual: 1 }]).valid) throw new Error('Packed validation failed.');
    const loader = await import('${manifest.name}/loader');
    if (await loader.loadA11yTargetLineChart() !== false) throw new Error('Packed loader should resolve false without a DOM.');
  `;
  execFileSync(process.execPath, ['--input-type=module', '-e', runtimeSmoke], { cwd: consumer, stdio: 'inherit' });

  await writeFile(join(consumer, 'smoke.mts'), `
    import { buildSemanticModel, normalizeLineData, resolveConfig, validateData, type A11yTargetLineChartDatum } from '${manifest.name}/core';
    import { A11yTargetLineChartElement, buildChartOptions, type A11yTargetLineChartConfig } from '${manifest.name}';
    import { defineA11yTargetLineChart } from '${manifest.name}/define';
    import { loadA11yTargetLineChart } from '${manifest.name}/loader';
    const loaded: Promise<boolean> = loadA11yTargetLineChart();
    void loaded;
    const rows: A11yTargetLineChartDatum[] = [{ x: 'typed', actual: 2 }];
    const config: A11yTargetLineChartConfig = resolveConfig(undefined);
    resolveConfig(undefined);
    normalizeLineData(rows);
    validateData(rows);
    type ChartOptionType = ReturnType<typeof buildChartOptions>;
    void (null as unknown as ChartOptionType);
    void A11yTargetLineChartElement;
    void defineA11yTargetLineChart;
    void buildSemanticModel;
  `);
  execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '--strict', '--noEmit', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', 'smoke.mts'], { cwd: consumer, stdio: 'inherit' });

  const dist = join(consumer, 'node_modules', ...manifest.name.split('/'), 'dist');
  for (const name of ['index.js', 'core.js', 'define.js', 'loader.js', 'chart.js', 'styles.css', 'ECHARTS-LICENSE', 'ECHARTS-NOTICE', 'ECHARTS-LICENSE-d3', 'ZRENDER-LICENSE', 'TSLIB-LICENSE']) {
    await readFile(join(dist, name));
  }
  const javascript = await Promise.all(['index.js', 'core.js', 'define.js', 'loader.js', 'chart.js'].map((name) => readFile(join(dist, name), 'utf8')));
  await init;
  for (const source of javascript) {
    const [imports] = parse(source);
    for (const item of imports) {
      if (!item.n.startsWith('.') && !item.n.startsWith('/')) throw new Error(`Packed artifact has a bare runtime import: ${item.n}`);
    }
  }
  const [loaderImports] = parse(await readFile(join(dist, 'loader.js'), 'utf8'));
  if (loaderImports.some((item) => item.d === -1)) throw new Error('loader.js must not have static imports.');
  if (!loaderImports.some((item) => item.n === './define.js')) throw new Error('loader.js must lazily import ./define.js.');
  console.log(`Packed ${manifest.name}: core runtime, declarations, standalone JS, and CSS verified.`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
