// Fails unless every published package has the same version, optionally matching a tag (v1.2.3).
// Usage: npm run release:check [-- v1.2.3]
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { isReleaseVersion } from './semver.mjs';

const PACKAGES = ['target-line-chart', 'bar-chart', 'segmented-bar-chart'];
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifests = await Promise.all(PACKAGES.map(async (name) => JSON.parse(await readFile(resolve(root, 'packages', name, 'package.json'), 'utf8'))));
const problems = [];
const versions = new Set(manifests.map((manifest) => manifest.version));
if (versions.size !== 1) problems.push(`Package versions differ: ${manifests.map((m) => `${m.name}@${m.version}`).join(', ')}`);
const [version] = versions;
for (const manifest of manifests) {
  if (!isReleaseVersion(manifest.version)) problems.push(`${manifest.name}@${manifest.version} is not a valid SemVer release version.`);
}
if (version === '0.0.0') problems.push('Version is still 0.0.0; run npm run release:version -- <version>.');
const tag = process.argv[2];
if (tag && tag !== `v${version}`) problems.push(`Tag ${tag} does not match package version v${version}.`);
for (const manifest of manifests) {
  if (manifest.private) problems.push(`${manifest.name} is private.`);
  if (!manifest.name.startsWith('@mzebley-aem/')) problems.push(`${manifest.name} is not in the @mzebley-aem scope GitHub Packages requires.`);
  if (manifest.license !== 'MIT') problems.push(`${manifest.name} must declare the MIT license.`);
  if (manifest.publishConfig?.registry !== 'https://npm.pkg.github.com') problems.push(`${manifest.name} does not publish to GitHub Packages.`);
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`Release check passed for v${version}.`);
