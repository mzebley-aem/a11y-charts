import { copyFile, mkdir } from 'node:fs/promises';

const source = new URL('../src/styles.css', import.meta.url);
const destinationDir = new URL('../dist/', import.meta.url);
await mkdir(destinationDir, { recursive: true });
await copyFile(source, new URL('styles.css', destinationDir));
