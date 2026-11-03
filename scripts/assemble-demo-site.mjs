import { copyFile, cp, mkdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('dist/gallery/', root);

// Preserve the existing report URL and its bundled assets beside the gallery.
await cp(new URL('packages/line-chart/demo/report-build/', root), output, { recursive: true });
await mkdir(new URL('demo/', output), { recursive: true });
await copyFile(new URL('packages/line-chart/demo/index.html', root), new URL('demo/line-chart.html', output));
await copyFile(new URL('packages/bar-chart/demo/index.html', root), new URL('demo/bar-chart.html', output));
