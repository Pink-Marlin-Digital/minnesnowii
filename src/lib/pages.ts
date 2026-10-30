import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface PageIcon {
  rel: string;
  href: string;
  sizes: string;
  type: string;
}

export interface PageData {
  id: string;
  path: string;
  title: string;
  description: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogImageWidth: string;
  ogImageHeight: string;
  ogType: string;
  ogLocale: string;
  twitterCard: string;
  twitterSite: string;
  jsonLd: string[];
  bodyClass: string;
  stylesheets: string[];
  icons: PageIcon[];
  lcpImage: string;
  notFound?: boolean;
}

const DATA_ROOT = join(process.cwd(), 'src/data');

export function loadPages(): PageData[] {
  const raw = readFileSync(join(DATA_ROOT, 'manifest.json'), 'utf8');
  return JSON.parse(raw) as PageData[];
}

export function routablePages(): PageData[] {
  return loadPages().filter((page) => !page.notFound);
}

export function readPageHtml(page: PageData): string {
  return readFileSync(join(DATA_ROOT, 'html', `${page.id}.html`), 'utf8');
}

export function bundleHref(stylesheets: string[]): string {
  const hash = createHash('sha1').update(stylesheets.join('\n')).digest('hex').slice(0, 12);
  return `/assets/css/bundles/${hash}.css`;
}

export function homePage(): PageData {
  const home = routablePages().find((page) => page.path === '/');
  if (!home) {
    throw new Error('Manifest is missing the home page.');
  }
  return home;
}

export function notFoundPage(): PageData | undefined {
  return loadPages().find((page) => page.notFound);
}
