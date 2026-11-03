import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const typeRoot = resolve(root, 'dist/types/line-chart');
await mkdir(typeRoot, { recursive: true });

for (const entry of ['index', 'core', 'define']) {
  const input = resolve(typeRoot, 'src', `${entry}.d.ts`);
  const bundle = await rollup({ input, plugins: [dts({ respectExternal: true })] });
  await bundle.write({ file: resolve(typeRoot, `${entry}.d.ts`), format: 'es' });
  await bundle.close();
}
