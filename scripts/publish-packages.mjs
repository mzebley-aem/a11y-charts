// Publishes every chart package, skipping versions already in the registry so a partly failed
// release can be rerun. Registry lookup errors other than "not found" (for example 401/403 or a
// network failure) stop the release instead of being treated as "not published".
// Usage: node scripts/publish-packages.mjs [--dry-run]
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const PACKAGES = ['target-line-chart', 'bar-chart', 'segmented-bar-chart'];

/** Classifies an `npm view <name>@<version> version` result. */
export function classifyView({ status, stdout = '', stderr = '' }, version) {
  if (status === 0) return stdout.trim() === version ? 'published' : 'missing';
  if (/\bE404\b/.test(stderr)) return 'missing';
  return 'error';
}

function npm(args) {
  const result = spawnSync('npm', args, { encoding: 'utf8' });
  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? String(result.error ?? '') };
}

export async function publishAll({ root, dryRun = false, run = npm, log = console.log }) {
  for (const chart of PACKAGES) {
    const directory = resolve(root, 'packages', chart);
    const { name, version, publishConfig } = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'));
    const registry = publishConfig?.registry;
    const view = run(['view', `${name}@${version}`, 'version', ...(registry ? ['--registry', registry] : [])]);
    const state = classifyView(view, version);
    if (state === 'error') throw new Error(`Could not check whether ${name}@${version} is published:\n${view.stderr.trim()}`);
    if (state === 'published') { log(`Skipping ${name}@${version}: already published.`); continue; }
    log(`${dryRun ? 'Would publish' : 'Publishing'} ${name}@${version}.`);
    if (dryRun) continue;
    const published = run(['publish', directory]);
    if (published.status !== 0) throw new Error(`Publishing ${name}@${version} failed:\n${published.stderr.trim()}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await publishAll({ root: resolve(fileURLToPath(new URL('..', import.meta.url))), dryRun: process.argv.includes('--dry-run') });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
