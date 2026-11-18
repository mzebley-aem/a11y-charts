import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The built docs site, from `npm run docs:build`. */
export const docsDist = fileURLToPath(new URL('../../../docs/dist/', import.meta.url));

/**
 * Every built docs page, as a site path such as `/charts/target-line-chart/`. Pass
 * `excluded` directory names to skip, such as `reports` for the full-page
 * report prototypes outside the docs layout.
 */
export function builtPages(excluded: string[] = []): string[] {
  if (!existsSync(docsDist)) throw new Error(`No docs build at ${docsDist}. Run \`npm run docs:build\` first.`);
  const pages: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        // Static assets and the search index have no pages.
        if (!['_astro', 'pagefind', ...excluded].includes(name)) walk(path);
      } else if (name === 'index.html') {
        const route = relative(docsDist, dir).split(sep).filter(Boolean).join('/');
        pages.push(route ? `/${route}/` : '/');
      }
    }
  };
  walk(docsDist);
  return pages.sort();
}
