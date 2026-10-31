import { createHash } from 'node:crypto';

const INTERNAL_HOSTS = new Set([
  'minnesnowii.com',
  'www.minnesnowii.com',
  'minnesnowii.netlify.app',
  '127.0.0.1',
  'localhost',
]);

function isFilePath(pathname: string): boolean {
  return /\.[a-z0-9]{2,5}$/i.test(pathname);
}

export function normalizeHref(href: string): string {
  if (!href || href.startsWith('java'.concat('script:'))) {
    return '';
  }
  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }
  try {
    const url = new URL(href, 'https://minnesnowii.com');
    if (!INTERNAL_HOSTS.has(url.hostname)) {
      return url.href;
    }
    let pathname = url.pathname || '/';
    if (!pathname.endsWith('/') && !isFilePath(pathname)) {
      pathname = `${pathname}/`;
    }
    return `${pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

export function normalizeStyleValue(value: string): string {
  return value
    .replace(/https?:\/\/(?:www\.)?minnesnowii\.com/g, '')
    .replace(/https?:\/\/127\.0\.0\.1:\d+/g, '')
    .replace(/https?:\/\/localhost:\d+/g, '')
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function assetPath(src: string): string {
  try {
    const url = new URL(src, 'https://minnesnowii.com');
    if (!INTERNAL_HOSTS.has(url.hostname)) {
      if (!/\.(png|jpe?g|gif|webp|svg|ico|avif)$/i.test(url.pathname)) {
        return url.href.split('?')[0];
      }
      const extension = url.pathname.slice(url.pathname.lastIndexOf('.'));
      const hash = createHash('sha1').update(url.href.split('#')[0]).digest('hex').slice(0, 16);
      return `/assets/remote/${url.hostname}/${hash}${extension}`;
    }
    return decodeURIComponent(url.pathname);
  } catch {
    return src;
  }
}
