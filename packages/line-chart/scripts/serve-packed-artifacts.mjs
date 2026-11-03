import { createServer } from 'node:http';
import { mkdtemp, readFile, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Serve only npm-packed files from a fresh directory. The dev server/source
// resolver is deliberately absent so an accidental workspace dependency fails.
const packages = fileURLToPath(new URL('../../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'a11y-chart-artifacts-'));
for (const kind of ['line', 'bar']) {
  const folder = join(temporary, kind);
  await mkdir(folder);
  const result = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', folder], {
    cwd: join(packages, `${kind}-chart`), encoding: 'utf8'
  }));
  execFileSync('tar', ['-xzf', join(folder, result[0].filename), '-C', folder]);
  for (const file of ['chart.js', 'define.js', 'styles.css']) {
    await readFile(join(folder, 'package', 'dist', file));
  }
}
const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:5190');
  const route = url.pathname;
  if (['/line', '/bar', '/both', '/'].includes(route)) {
    const kinds = route === '/line' ? ['line'] : route === '/bar' ? ['bar'] : ['line', 'bar'];
    const esm = url.searchParams.get('esm') === '1';
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Packed charts</title>${kinds.map(kind => `<link rel="stylesheet" href="/${kind}/styles.css"><script ${esm ? 'type="module"' : 'defer'} src="/${kind}/${esm ? 'define.js' : 'chart.js'}"></script>`).join('')}<style>body{margin:16px}main{max-width:100%}</style></head><body><main>${kinds.map(kind => `<a11y-${kind}-chart chart-title="${kind} chart"></a11y-${kind}-chart>`).join('')}</main><button id="outside">Outside</button></body></html>`);
    return;
  }
  const match = /^\/(line|bar)\/(.+)$/.exec(route);
  if (!match) { response.writeHead(404); response.end(); return; }
  const root = resolve(temporary, match[1], 'package', 'dist');
  const path = resolve(root, decodeURIComponent(match[2]));
  if (!path.startsWith(root + sep)) { response.writeHead(403); response.end(); return; }
  try {
    const data = await readFile(path);
    response.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' })[extname(path)] ?? 'application/octet-stream');
    response.end(data);
  } catch { response.writeHead(404); response.end(); }
});
server.listen(5190, '127.0.0.1');
async function stop() { server.close(); await rm(temporary, { recursive: true, force: true }); process.exit(0); }
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
