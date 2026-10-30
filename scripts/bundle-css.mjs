import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const manifestPath = join(root, 'src/data/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const groups = new Map();

manifest.forEach((page) => {
  const key = (page.stylesheets || []).join('\n');
  if (!groups.has(key)) {
    groups.set(key, page.stylesheets || []);
  }
});

function inlineImports(css, seen = new Set()) {
  const imports = [];
  const withoutImports = css.replace(/@import\s+(?:url\(\s*)?['"]([^'"]+)['"]\s*\)?\s*[^;]*;/g, (match, href) => {
    imports.push(href);
    return '';
  });
  const inlined = imports.map((href) => {
    if (!href.startsWith('/') || seen.has(href)) return '';
    seen.add(href);
    const file = join(root, 'public', href);
    return inlineImports(readFileSync(file, 'utf8'), seen);
  }).join('\n');
  return `${inlined}\n${withoutImports}`;
}

groups.forEach((sheets, key) => {
  const hash = createHash('sha1').update(key).digest('hex').slice(0, 12);
  const outFile = join(root, 'public/assets/css/bundles', `${hash}.css`);
  mkdirSync(dirname(outFile), { recursive: true });
  const css = inlineImports(sheets
    .map((href) => readFileSync(join(root, 'public', href), 'utf8'))
    .join('\n'));
  writeFileSync(outFile, css);
});

const cloneSource = join(root, 'src/styles/clone.css');
const cloneDest = join(root, 'public/assets/css/clone.css');
mkdirSync(dirname(cloneDest), { recursive: true });
copyFileSync(cloneSource, cloneDest);

process.stdout.write(`Wrote ${groups.size} stylesheet bundles.\n`);
