import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';

const ORIGIN = 'https://minnesnowii.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const ROOT = process.cwd();
const PUBLIC = join(ROOT, 'public');
const STYLE_PROPERTIES = [
  'color',
  'background-color',
  'background-image',
  'background-size',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'text-align',
  'display',
  'padding-top',
  'padding-bottom',
  'margin-top',
  'letter-spacing',
  'text-transform',
  'box-shadow',
  'border-top-color',
];
const SELECTORS = [
  'body',
  '.top-bar',
  '.top-bar a',
  '#site-navigation',
  '#menu-header-menu > li > a',
  '.navbar',
  '.site-footer',
  '#book-title',
  '#book-number',
  '#content',
  'h1',
  'h2',
  '.entry-title',
  '.footer-icon',
  '#masthead',
];
const MOBILE_PATHS = new Set([
  '/',
  '/contact/',
  '/jobs/',
  '/fun-with-shave-ice/',
  '/gallery/',
  '/blog/',
  '/in-the-media/',
  '/in-the-news/',
  '/rochester/',
  '/where-to-find-minnesnowii/',
  '/shop/',
  '/events-2/',
  '/newsletter/',
  '/contest/',
]);

const downloadQueue = [];
const failures = [];
const pages = [];
const usedIds = new Set();

function ensureDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function pageId(urlPath) {
  const base = urlPath === '/'
    ? 'home'
    : urlPath.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'page';
  let id = base;
  if (usedIds.has(id)) {
    id = `${base}-${createHash('sha1').update(urlPath).digest('hex').slice(0, 4)}`;
  }
  usedIds.add(id);
  return id;
}

function toPath(loc) {
  const url = new URL(loc, ORIGIN);
  let pathname = url.pathname || '/';
  if (!pathname.endsWith('/')) pathname = `${pathname}/`;
  return pathname;
}

function isSameOrigin(absoluteUrl) {
  try {
    const { hostname } = new URL(absoluteUrl);
    return hostname === 'minnesnowii.com' || hostname === 'www.minnesnowii.com';
  } catch {
    return false;
  }
}

function isCss(absoluteUrl) {
  const url = new URL(absoluteUrl);
  return url.hostname === 'fonts.googleapis.com' || url.pathname.toLowerCase().endsWith('.css');
}

function shouldDownload(absoluteUrl) {
  let url;
  try {
    url = new URL(absoluteUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.hostname === 'fonts.googleapis.com') return true;
  const pathname = url.pathname.toLowerCase();
  if (/\.(css|png|jpe?g|gif|webp|svg|ico|avif|woff2?|ttf|eot|otf|mp4|webm)$/.test(pathname)) return true;
  if (/cdninstagram|fbcdn|twimg|googleusercontent/.test(url.hostname) && !pathname.endsWith('.js')) return true;
  return false;
}

function localPathFor(absoluteUrl) {
  const url = new URL(absoluteUrl);
  if (url.hostname === 'fonts.googleapis.com') {
    const hash = createHash('sha1').update(url.href).digest('hex').slice(0, 12);
    return `/assets/vendor/google-fonts/${hash}.css`;
  }
  if (isSameOrigin(absoluteUrl)) return decodeURIComponent(url.pathname);
  const extension = url.pathname.includes('.') ? url.pathname.slice(url.pathname.lastIndexOf('.')) : '';
  const safeExtension = extension.length <= 6 ? extension : '';
  const hash = createHash('sha1').update(url.href.split('#')[0]).digest('hex').slice(0, 16);
  return `/assets/remote/${url.hostname}/${hash}${safeExtension}`;
}

function enqueue(absoluteUrl) {
  if (!absoluteUrl || !shouldDownload(absoluteUrl)) return;
  downloadQueue.push(absoluteUrl.split('#')[0]);
}

function rewriteCss(css, baseUrl) {
  const swap = (raw) => {
    const cleaned = raw.trim().replace(/^['"]|['"]$/g, '');
    if (!cleaned || cleaned.startsWith('data:') || cleaned.startsWith('#')) return null;
    let absolute;
    try {
      absolute = new URL(cleaned, baseUrl).href.split('#')[0];
    } catch {
      return null;
    }
    if (!shouldDownload(absolute)) return null;
    enqueue(absolute);
    return localPathFor(absolute);
  };
  return css
    .replace(/url\(\s*(['"]?)(.*?)\1\s*\)/g, (match, quote, raw) => {
      const local = swap(raw);
      return local ? `url("${local}")` : match;
    })
    .replace(/@import\s+(?!url\()(['"])([^'"]+)\1/g, (match, quote, raw) => {
      const local = swap(raw);
      return local ? `@import "${local}"` : match;
    });
}

function collectRootAssets(text) {
  const matches = text.match(/["'(](\/(?:wp-content|wp-includes)\/[^"'()\s]+)/g) || [];
  matches.forEach((raw) => {
    const pathOnly = raw.slice(1).split('?')[0].split('#')[0];
    enqueue(`${ORIGIN}${pathOnly}`);
  });
}

function rewriteHtml(html, pageUrl) {
  const external = new Set();
  const matches = html.match(/https?:\/\/[^\s"'<>\\)]+/g) || [];
  matches.forEach((raw) => {
    const clean = raw.replace(/&amp;/g, '&').replace(/[),.;]+$/, '');
    if (!isSameOrigin(clean) && shouldDownload(clean)) external.add(clean);
    enqueue(clean);
  });
  let out = html;
  [...external].sort((a, b) => b.length - a.length).forEach((from) => {
    const to = localPathFor(from);
    out = out.split(from).join(to);
    out = out.split(from.replace(/^https?:/, '')).join(to);
  });
  const stripOrigin = (source) => source.replace(
    /(?:https?:)?\/\/(?:www\.)?minnesnowii\.com(?=\/|['"?#\s]|$)/gi,
    (match, offset, text) => (text[offset + match.length] === '/' ? '' : '/'),
  );
  out = stripOrigin(out);
  out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (block) => rewriteCss(block, pageUrl));
  collectRootAssets(out);
  return out;
}

function enhanceForms(html, pagePath) {
  let index = 0;
  return html.replace(/<form\b([^>]*)>/gi, (full, attrs) => {
    index += 1;
    const idMatch = attrs.match(/\bid=(['"])(.*?)\1/i);
    const rawId = idMatch ? idMatch[2] : `form-${index}`;
    const name = `minnesnowii-${rawId}`.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 60);
    let next = attrs
      .replace(/\saction=(['"]).*?\1/gi, '')
      .replace(/\smethod=(['"]).*?\1/gi, '')
      .replace(/\sonsubmit=(['"]).*?\1/gi, '')
      .replace(/\starget=(['"]).*?\1/gi, '')
      .replace(/\sdata-netlify=(['"]).*?\1/gi, '')
      .replace(/\snetlify-honeypot=(['"]).*?\1/gi, '')
      .replace(/\sname=(['"]).*?\1/gi, '');
    if (next.length && !next.startsWith(' ')) next = ` ${next}`;
    return `<form${next} method="POST" action="${pagePath}" name="${name}" data-netlify="true" netlify-honeypot="bot-field"><input type="hidden" name="form-name" value="${name}" /><input class="netlify-honeypot" name="bot-field" tabindex="-1" autocomplete="off" aria-hidden="true" />`;
  });
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function sitemapPaths() {
  const files = [
    'page-sitemap.xml',
    'post-sitemap.xml',
    'category-sitemap.xml',
    'post_tag-sitemap.xml',
    'author-sitemap.xml',
  ];
  const chunks = await Promise.all(files.map(async (file) => {
    try {
      return await fetchText(`${ORIGIN}/${file}`);
    } catch (error) {
      failures.push({ url: file, error: String(error) });
      return '';
    }
  }));
  const paths = chunks.flatMap((xml) => [...xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/g)].map((match) => toPath(match[1])));
  return [...new Set(paths)];
}

async function scrapeOne(context, urlPath, { notFound = false } = {}) {
  const page = await context.newPage();
  const requested = notFound ? `${ORIGIN}/this-page-does-not-exist-minnesnowii/` : `${ORIGIN}${urlPath}`;
  try {
    const response = await page.goto(requested, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const status = response ? response.status() : 0;
    if (!notFound && status >= 400) {
      process.stdout.write(`skip ${urlPath} ${status}\n`);
      return [];
    }
    await page.waitForSelector('#colophon, footer, body', { timeout: 20000 }).catch(() => {});
    await page.evaluate(async () => {
      const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
      const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const step = Math.max(window.innerHeight * 0.8, 400);
      let y = 0;
      while (y < height) {
        window.scrollTo(0, y);
        y += step;
        await wait(40);
      }
      window.scrollTo(0, 0);
    });
    await page.waitForFunction(() => {
      const grids = [...document.querySelectorAll('.vc_grid-container')];
      if (!grids.length) return true;
      return grids.every((grid) => grid.querySelector('.vc_grid-item'));
    }, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.evaluate(async () => {
      const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
      const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const step = Math.max(window.innerHeight * 0.8, 400);
      let y = 0;
      while (y < height) {
        window.scrollTo(0, y);
        y += step;
        await wait(40);
      }
      window.scrollTo(0, 0);
      document.querySelectorAll('.wpb_animate_when_almost_visible, .animated').forEach((element) => {
        element.classList.add('wpb_start_animation', 'animated');
        element.style.setProperty('opacity', '1', 'important');
        element.style.setProperty('animation', 'none', 'important');
      });
      const firstImage = document.querySelector('#main img, #content img, img');
      if (firstImage) {
        firstImage.setAttribute('loading', 'eager');
        firstImage.setAttribute('fetchpriority', 'high');
      }
      await document.fonts.ready;
      const pending = [...document.images].filter((img) => !img.complete);
      await Promise.race([
        Promise.all(pending.map((img) => new Promise((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
          setTimeout(done, 5000);
        }))),
        wait(8000),
      ]);
    });
    await page.waitForFunction(() => {
      const grids = [...document.querySelectorAll('.vc_grid-container')];
      if (!grids.length) return true;
      return grids.every((grid) => grid.querySelector('.vc_grid-item'));
    }, { timeout: 15000 }).catch(() => {});
    await page.evaluate(async () => {
      await document.fonts.ready;
      const pending = [...document.images].filter((img) => !img.complete);
      await Promise.race([
        Promise.all(pending.map((img) => new Promise((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
          setTimeout(done, 5000);
        }))),
        new Promise((resolve) => { setTimeout(resolve, 8000); }),
      ]);
    });

    const captured = await page.evaluate(({ selectors, properties }) => {
      const clone = document.body.cloneNode(true);
      clone.querySelectorAll('script, link[rel="stylesheet"]').forEach((node) => node.remove());
      const stylesheets = [...document.querySelectorAll('link[rel="stylesheet"]')]
        .map((link) => link.href)
        .filter(Boolean);
      const inlineCss = [...document.head.querySelectorAll('style')].map((style) => style.textContent || '').join('\n');
      const metas = [...document.querySelectorAll('meta')].map((meta) => ({
        name: meta.getAttribute('name') || '',
        property: meta.getAttribute('property') || '',
        content: meta.getAttribute('content') || '',
      }));
      const icons = [...document.querySelectorAll('link[rel*="icon"]')].map((link) => ({
        rel: link.getAttribute('rel') || 'icon',
        href: link.href,
        sizes: link.getAttribute('sizes') || '',
        type: link.getAttribute('type') || '',
      }));
      const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map((script) => script.textContent || '');
      const styles = Object.fromEntries(selectors.map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return [selector, null];
        const computed = getComputedStyle(element);
        return [selector, Object.fromEntries(properties.map((property) => [property, computed.getPropertyValue(property)]))];
      }));
      return {
        title: document.title,
        bodyClass: document.body.className,
        html: clone.innerHTML,
        stylesheets,
        inlineCss,
        metas,
        icons,
        jsonLd,
        styles,
        text: document.body.innerText,
        links: [...document.querySelectorAll('a[href]')].map((anchor) => anchor.href),
        images: [...document.querySelectorAll('img')].map((img) => ({
          alt: img.getAttribute('alt') || '',
          src: img.currentSrc || img.src,
        })),
        scrollHeight: document.body.scrollHeight,
      };
    }, { selectors: SELECTORS, properties: STYLE_PROPERTIES });

    const id = notFound ? 'not-found' : pageId(urlPath);
    const finalPath = notFound ? '/404/' : toPath(page.url());
    const shotDir = join(ROOT, 'tests/reference/screenshots');
    mkdirSync(shotDir, { recursive: true });
    await page.screenshot({ path: join(shotDir, `${id}.png`), animations: 'disabled' });
    const takeFull = !finalPath.startsWith('/tag/') && captured.scrollHeight < 16000;
    if (takeFull) {
      await page.screenshot({
        path: join(shotDir, `${id}.full.png`),
        animations: 'disabled',
        fullPage: true,
      }).catch((error) => failures.push({ url: requested, error: `screenshot ${error}` }));
    }
    const mobile = MOBILE_PATHS.has(finalPath);
    if (mobile) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(250);
      await page.screenshot({ path: join(shotDir, `${id}.mobile.png`), animations: 'disabled' });
    }

    const metaContent = (attr, key) => {
      const found = captured.metas.find((meta) => (meta[attr] || '').toLowerCase() === key);
      return found ? found.content : '';
    };
    const robots = metaContent('name', 'robots')
      || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    const description = metaContent('name', 'description');
    const ogTitle = metaContent('property', 'og:title') || captured.title;
    const ogDescription = metaContent('property', 'og:description') || description;
    const ogImageRaw = metaContent('property', 'og:image');
    const twitterCard = metaContent('name', 'twitter:card') || 'summary_large_image';
    const twitterSite = metaContent('name', 'twitter:site') || '@Minnesnowii';
    if (ogImageRaw) enqueue(ogImageRaw);
    captured.stylesheets.forEach((href) => enqueue(href));
    captured.icons.forEach((icon) => enqueue(icon.href));

    const pageUrl = `${ORIGIN}${finalPath}`;
    let html = rewriteHtml(captured.html, pageUrl);
    html = enhanceForms(html, finalPath);
    const inlineCss = rewriteCss(captured.inlineCss || '', pageUrl);
    const lcpMatch = html.match(/<img\b[^>]*\bsrc=(['"])(.*?)\1/i);
    const stylesheets = [];
    const seenSheets = new Set();
    captured.stylesheets.forEach((href) => {
      if (!shouldDownload(href) && !isCss(href)) return;
      const local = localPathFor(href);
      if (seenSheets.has(local)) return;
      seenSheets.add(local);
      stylesheets.push(local);
      enqueue(href);
    });
    const icons = captured.icons.map((icon) => ({
      ...icon,
      href: shouldDownload(icon.href) ? localPathFor(icon.href) : icon.href,
    }));
    const ogImage = ogImageRaw && shouldDownload(ogImageRaw) ? localPathFor(ogImageRaw) : ogImageRaw;

    const record = {
      id,
      path: finalPath,
      title: captured.title,
      description,
      robots,
      ogTitle,
      ogDescription,
      ogImage: ogImage || '',
      ogImageWidth: metaContent('property', 'og:image:width'),
      ogImageHeight: metaContent('property', 'og:image:height'),
      ogType: metaContent('property', 'og:type') || 'website',
      ogLocale: metaContent('property', 'og:locale') || 'en_US',
      twitterCard,
      twitterSite,
      jsonLd: captured.jsonLd.map((block) => block.replaceAll('</', '<\\/')),
      bodyClass: captured.bodyClass,
      stylesheets,
      icons,
      lcpImage: lcpMatch ? lcpMatch[2] : '',
      notFound,
    };
    pages.push(record);
    ensureDir(join(ROOT, 'src/data/html', `${id}.html`));
    writeFileSync(join(ROOT, 'src/data/html', `${id}.html`), html);
    ensureDir(join(PUBLIC, 'assets/css/inline', `${id}.css`));
    writeFileSync(join(PUBLIC, 'assets/css/inline', `${id}.css`), inlineCss);
    const reference = {
      id,
      path: finalPath,
      title: captured.title,
      description,
      robots,
      ogTitle,
      ogDescription,
      ogImage: ogImageRaw,
      twitterCard,
      jsonLdCount: captured.jsonLd.length,
      text: captured.text,
      links: captured.links,
      images: captured.images,
      styles: captured.styles,
      scrollHeight: captured.scrollHeight,
      mobile,
      notFound,
    };
    ensureDir(join(ROOT, 'tests/reference/pages', `${id}.json`));
    writeFileSync(join(ROOT, 'tests/reference/pages', `${id}.json`), JSON.stringify(reference));
    process.stdout.write(`saved ${finalPath} (${id}) images=${captured.images.length} css=${stylesheets.length}\n`);
    return captured.links;
  } finally {
    await page.close();
  }
}

async function pool(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

async function downloadAll() {
  const pending = [...new Set(downloadQueue)];
  const downloaded = new Set();
  let cursor = 0;
  let active = 0;
  const workers = Array.from({ length: 8 }, async () => {
    while (true) {
      if (cursor >= pending.length) {
        if (active === 0) return;
        await new Promise((resolve) => { setTimeout(resolve, 25); });
        continue;
      }
      const absoluteUrl = pending[cursor];
      cursor += 1;
      active += 1;
      if (!shouldDownload(absoluteUrl)) {
        active -= 1;
        continue;
      }
      const local = localPathFor(absoluteUrl);
      if (downloaded.has(local)) {
        active -= 1;
        continue;
      }
      downloaded.add(local);
      const dest = join(PUBLIC, local);
      ensureDir(dest);
      try {
        if (isCss(absoluteUrl)) {
          const css = await fetchText(absoluteUrl);
          const found = [];
          const rewritten = css
            .replace(/url\(\s*(['"]?)(.*?)\1\s*\)/g, (match, quote, raw) => {
              const cleaned = raw.trim().replace(/^['"]|['"]$/g, '');
              if (!cleaned || cleaned.startsWith('data:') || cleaned.startsWith('#')) return match;
              let resolved;
              try {
                resolved = new URL(cleaned, absoluteUrl).href.split('#')[0];
              } catch {
                return match;
              }
              if (!shouldDownload(resolved)) return match;
              found.push(resolved);
              return `url("${localPathFor(resolved)}")`;
            })
            .replace(/@import\s+(?!url\()(['"])([^'"]+)\1/g, (match, quote, raw) => {
              let resolved;
              try {
                resolved = new URL(raw, absoluteUrl).href.split('#')[0];
              } catch {
                return match;
              }
              if (!shouldDownload(resolved)) return match;
              found.push(resolved);
              return `@import "${localPathFor(resolved)}"`;
            });
          writeFileSync(dest, rewritten);
          found.forEach((next) => {
            if (!pending.includes(next)) pending.push(next);
          });
        } else {
          const response = await fetch(absoluteUrl, {
            headers: { 'User-Agent': UA },
            signal: AbortSignal.timeout(30000),
          });
          if (!response.ok) throw new Error(`${response.status} ${absoluteUrl}`);
          writeFileSync(dest, Buffer.from(await response.arrayBuffer()));
        }
      } catch (error) {
        failures.push({ url: absoluteUrl, error: String(error) });
        if (isCss(absoluteUrl)) writeFileSync(dest, '/* missing */\n');
      } finally {
        active -= 1;
      }
    }
  });
  await Promise.all(workers);
  process.stdout.write(`downloaded ${downloaded.size} assets, failures ${failures.length}\n`);
}

function browserContext(browser) {
  return browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    userAgent: UA,
  });
}

function silenceTrackers(context) {
  return context.route('**/*', (route) => {
    const url = route.request().url();
    if (/google-analytics|googletagmanager|doubleclick|hotjar|clarity\.ms|facebook\.net|connect\.facebook/.test(url)) {
      route.abort();
      return;
    }
    route.continue();
  });
}

async function main() {
  const only = process.argv.slice(2).filter((arg) => arg.startsWith('/'));
  ['src/data/html', 'tests/reference/pages', 'tests/reference/screenshots', 'public/assets/css/inline'].forEach((dir) => {
    mkdirSync(join(ROOT, dir), { recursive: true });
  });
  if (only.length) {
    const browser = await chromium.launch({ headless: true });
    const context = await browserContext(browser);
    await silenceTrackers(context);
    for (let index = 0; index < only.length; index += 1) {
      const urlPath = only[index];
      try {
        await scrapeOne(context, urlPath);
      } catch (error) {
        failures.push({ url: urlPath, error: String(error) });
        process.stdout.write(`failed ${urlPath} ${error}\n`);
      }
    }
    await browser.close();
    await downloadAll();
    const manifestPath = join(ROOT, 'src/data/manifest.json');
    const existing = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const byPath = new Map(existing.map((page) => [page.path, page]));
    pages.forEach((page) => byPath.set(page.path, page));
    const uniquePages = [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
    writeFileSync(manifestPath, JSON.stringify(uniquePages, null, 2));
    writeFileSync(join(ROOT, 'src/data/scrape-report.json'), JSON.stringify({ failures, pages: uniquePages.length }, null, 2));
    process.stdout.write(`refreshed ${pages.length} pages, manifest ${uniquePages.length}\n`);
    return;
  }
  const seeds = await sitemapPaths();
  process.stdout.write(`seeded ${seeds.length} urls\n`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    userAgent: UA,
  });
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (/google-analytics|googletagmanager|doubleclick|hotjar|clarity\.ms|facebook\.net|connect\.facebook/.test(url)) {
      route.abort();
      return;
    }
    route.continue();
  });

  const done = new Set();
  let pending = seeds;
  for (let pass = 0; pass < 4 && pending.length; pass += 1) {
    const batch = [...new Set(pending.filter((item) => !done.has(item)))];
    pending = [];
    process.stdout.write(`pass ${pass + 1}: ${batch.length} pages\n`);
    await pool(batch, 2, async (urlPath) => {
      done.add(urlPath);
      try {
        const links = await scrapeOne(context, urlPath);
        links.forEach((href) => {
          try {
            const url = new URL(href, ORIGIN);
            if (url.hostname !== 'minnesnowii.com' && url.hostname !== 'www.minnesnowii.com') return;
            if (/^\/(wp-admin|wp-login|wp-json|wp-includes|wp-content|feed|xmlrpc)/.test(url.pathname)) return;
            if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) return;
            const next = toPath(url.href);
            if (!done.has(next) && done.size < 240) pending.push(next);
          } catch {
            // Ignore malformed hrefs from the live page.
          }
        });
      } catch (error) {
        failures.push({ url: urlPath, error: String(error) });
        process.stdout.write(`failed ${urlPath} ${error}\n`);
      }
    });
  }
  try {
    await scrapeOne(context, '/404/', { notFound: true });
  } catch (error) {
    failures.push({ url: '/404/', error: String(error) });
  }
  await browser.close();
  await downloadAll();
  const uniquePages = [];
  const seenPaths = new Set();
  pages.sort((a, b) => a.path.localeCompare(b.path));
  pages.forEach((page) => {
    if (seenPaths.has(page.path)) return;
    seenPaths.add(page.path);
    uniquePages.push(page);
  });
  writeFileSync(join(ROOT, 'src/data/manifest.json'), JSON.stringify(uniquePages, null, 2));
  writeFileSync(join(ROOT, 'src/data/scrape-report.json'), JSON.stringify({ failures, pages: uniquePages.length }, null, 2));
  process.stdout.write(`manifest ${uniquePages.length} pages\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exit(1);
});
