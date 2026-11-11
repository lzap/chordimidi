import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

const hash = createHash('sha256');
hash.update(await readFile('src/styles.css'));
for (const file of (await readdir('src/js')).sort()) {
  hash.update(await readFile(`src/js/${file}`));
}
const version = hash.digest('hex').slice(0, 10);
const assetRoot = `dist/assets/${version}`;
await mkdir(assetRoot, { recursive: true });
await cp('src/styles.css', `${assetRoot}/styles.css`);
await cp('src/js', `${assetRoot}/js`, { recursive: true });

let html = await readFile('src/index.html', 'utf8');
if (!html.includes('./styles.css') || !html.includes('./js/app.js')) {
  throw new Error('Expected stylesheet and app script references in index.html');
}
html = html.replace('./styles.css', `./assets/${version}/styles.css`)
  .replace('./js/app.js', `./assets/${version}/js/app.js`);
await writeFile('dist/index.html', html);
console.log(`Built static site in dist/ with assets/${version}/`);
