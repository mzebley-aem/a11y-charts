import { copyFile, cp, mkdir, rm, stat } from 'node:fs/promises';

// The deployed site: the docs (including the examples and report prototypes) at
// the root, plus each package's self-contained standalone demo under /demo/.
// Run after the docs build (docs/dist) and each package's `demo:build`.
const root = new URL('../', import.meta.url);
const output = new URL('dist/site/', root);
const docs = new URL('docs/dist/', root);
const demos = [
	[new URL('packages/target-line-chart/demo/index.html', root), 'target-line-chart.html'],
	[new URL('packages/bar-chart/demo/index.html', root), 'bar-chart.html'],
];

try {
	await stat(docs);
} catch {
	throw new Error(`Missing docs build at ${docs.pathname}. Run \`npm run deploy:build\`.`);
}

await rm(output, { recursive: true, force: true });
await cp(docs, output, { recursive: true });
await mkdir(new URL('demo/', output), { recursive: true });
for (const [source, name] of demos) await copyFile(source, new URL(`demo/${name}`, output));
