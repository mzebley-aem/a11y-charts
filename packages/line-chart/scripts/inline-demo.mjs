import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const packageRoot = new URL('../', import.meta.url);
const templateUrl = new URL('demo/index.template.html', packageRoot);
const cssUrl = new URL('demo/build/chart-demo.css', packageRoot);
const javascriptUrl = new URL('demo/build/chart-demo.js', packageRoot);
const outputUrl = new URL('demo/index.html', packageRoot);

const [template, css, javascript] = await Promise.all([
  readFile(templateUrl, 'utf8'),
  readFile(cssUrl, 'utf8'),
  readFile(javascriptUrl, 'utf8')
]);

const html = template
  .replace(
    '/* DEMO_STYLES */',
    () => css.replaceAll('</style', '<\\/style')
  )
  .replace(
    '/* DEMO_SCRIPT */',
    () => javascript.replaceAll('</script', '<\\/script')
  );

if (html === template) {
  throw new Error('The demo template placeholders were not replaced.');
}

await writeFile(outputUrl, html);
console.log(`Wrote ${fileURLToPath(outputUrl)}`);
