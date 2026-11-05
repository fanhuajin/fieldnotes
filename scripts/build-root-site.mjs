import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(process.argv[2] || resolve(source, '.packaging/root-site'));
if (output === resolve(source)) throw new Error('Output must differ from the source directory.');
mkdirSync(output, { recursive: true });
for (const name of ['assets', 'vendor', 'lib', 'app.js', 'style.css', 'LICENSE']) {
  cpSync(resolve(source, name), resolve(output, name), { recursive: true });
}
const version = name => createHash('sha256').update(readFileSync(resolve(source, name))).digest('hex').slice(0, 12);
const html = readFileSync(resolve(source, 'index.html'), 'utf8')
  .replace('<base href="/fieldnotes/">', '<base href="/">')
  .replace("restoredRoute.startsWith('/fieldnotes/')", "restoredRoute.startsWith('/') && !restoredRoute.startsWith('//')")
  .replace(/style\.css\?v=[^"\s]+/, `style.css?v=${version('style.css')}`)
  .replace(/app\.js\?v=[^"\s]+/, `app.js?v=${version('app.js')}`);
writeFileSync(resolve(output, 'index.html'), html);
writeFileSync(resolve(output, '404.html'), readFileSync(resolve(source, '404.html'), 'utf8').replaceAll('/fieldnotes/', '/'));
writeFileSync(resolve(output, '.nojekyll'), '');

// Static entries let GitHub Pages serve known History routes without a 404 round trip.
const catalog = JSON.parse(readFileSync(resolve(source, 'assets/resources.json'), 'utf8'));
for (const page of ['home', 'tags', 'lists', ...catalog.collections.map(item => `list/${item.id}`)]) {
  if (!/^(home|tags|lists|list\/[a-z0-9-]+)$/.test(page)) throw new Error(`Invalid page: ${page}`);
  const directory = resolve(output, page);
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, 'index.html'), html);
}
console.log('Built root-domain website.');
