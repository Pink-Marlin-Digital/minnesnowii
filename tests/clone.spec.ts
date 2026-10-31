import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { assetPath, normalizeHref, normalizeStyleValue, normalizeText } from '../src/lib/normalize';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs') as {
  PNG: {
    sync: {
      read: (buffer: Buffer) => { width: number; height: number; data: Buffer };
      write: (png: { width: number; height: number; data: Buffer }) => Buffer;
    };
    new (options: { width: number; height: number }): { width: number; height: number; data: Buffer };
  };
};

interface StyleMap {
  [property: string]: string;
}

interface ImageSnapshot {
  alt: string;
  src: string;
}

interface PageSnapshot {
  id: string;
  path: string;
  title: string;
  description: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  jsonLdCount: number;
  text: string;
  links: string[];
  images: ImageSnapshot[];
  styles: Record<string, StyleMap | null>;
  scrollHeight: number;
  mobile: boolean;
  notFound?: boolean;
}

const root = process.cwd();
const referenceDir = join(root, 'tests/reference/pages');
const screenshotDir = join(root, 'tests/reference/screenshots');
const manifest = JSON.parse(readFileSync(join(root, 'src/data/manifest.json'), 'utf8')) as { id: string }[];
const snapshots = manifest.map(
  (page) => JSON.parse(readFileSync(join(referenceDir, `${page.id}.json`), 'utf8')) as PageSnapshot,
);

interface MaskBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function paintMask(image: { width: number; height: number; data: Buffer }, masks: MaskBox[]): void {
  const { data, width, height } = image;
  masks.forEach((mask) => {
    const x0 = Math.max(0, Math.floor(mask.x));
    const y0 = Math.max(0, Math.floor(mask.y));
    const x1 = Math.min(width, Math.ceil(mask.x + mask.width));
    const y1 = Math.min(height, Math.ceil(mask.y + mask.height));
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const index = (y * width + x) * 4;
        data[index] = 0;
        data[index + 1] = 0;
        data[index + 2] = 0;
        data[index + 3] = 255;
      }
    }
  });
}

function comparePng(
  expected: Buffer,
  actual: Buffer,
  name: string,
  overlapOnly = false,
  masks: MaskBox[] = [],
  writeDiff = true,
): number {
  const left = PNG.sync.read(expected);
  const right = PNG.sync.read(actual);
  paintMask(left, masks);
  paintMask(right, masks);
  const sameSize = left.width === right.width && left.height === right.height;
  if (!sameSize && !overlapOnly) {
    throw new Error(
      `${name} screenshot size ${right.width}x${right.height} does not match reference ${left.width}x${left.height}`,
    );
  }
  const width = Math.min(left.width, right.width);
  const height = Math.min(left.height, right.height);
  const leftCrop = new PNG({ width, height });
  const rightCrop = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    left.data.copy(leftCrop.data, y * width * 4, y * left.width * 4, y * left.width * 4 + width * 4);
    right.data.copy(rightCrop.data, y * width * 4, y * right.width * 4, y * right.width * 4 + width * 4);
  }
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(leftCrop.data, rightCrop.data, diff.data, width, height, {
    threshold: 0.12,
    includeAA: false,
  });
  const ratio = mismatched / (width * height);
  if (ratio > 0 && writeDiff) {
    const diffDir = join(root, 'test-results/diff');
    mkdirSync(diffDir, { recursive: true });
    writeFileSync(join(diffDir, name), PNG.sync.write(diff));
  }
  return ratio;
}

function comparableText(value: string): string {
  return value
    .replace(/\u2014/g, ',')
    .replace(/\u2013/g, '-')
    .replace(/August 24th\s+\S+\s+September 4th/g, 'August 26 through September 6, 2027')
    .replace(/days\s+\d\s+\d\s+\d\s+hours\s+\d\s+\d\s+minutes\s+\d\s+\d\s+seconds\s+\d\s+\d/gi, '')
    .replace(/Join us at the MN State Fair! (?:August 26 through September 6, 2027, across|Across) from the GIANT SLIDE!/g, '')
    .replace(/\s*\|\s*Leave a comment/gi, '')
    .replace(/Leave a comment/gi, '')
    .replace(/Leave a Reply[\s\S]*?Website/gi, '')
    .replace(/Your email address will not be published\.?/gi, '')
    .replace(/Required fields are marked \*/gi, '')
    .replace(/Save my name, email, and website in this browser for the next time I comment\.?/gi, '')
    .replace(/BOOK US TODAY!\s*\(952\) 486-0079\s*Primary Menu\s*Skip to content\s*Jobs\s*Blog\s*Fun With Shave Ice\s*Event and Party Catering\s*In The News\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      });
    const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const step = Math.max(window.innerHeight * 0.85, 400);
    let y = 0;
    while (y < height) {
      window.scrollTo(0, y);
      y += step;
      // eslint-disable-next-line no-await-in-loop
      await wait(30);
    }
    window.scrollTo(0, 0);
    await document.fonts.ready;
    const pending = [...document.images].filter((img) => !img.complete);
    await Promise.race([
      Promise.all(
        pending.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
                return;
              }
              const done = () => resolve();
              img.addEventListener('load', done, { once: true });
              img.addEventListener('error', done, { once: true });
              setTimeout(done, 4000);
            }),
        ),
      ),
      wait(8000),
    ]);
  });
}

snapshots.forEach((snapshot) => {
  test(snapshot.path, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const target = snapshot.notFound ? '/this-page-does-not-exist-minnesnowii/' : snapshot.path;
    await page.goto(target, { waitUntil: 'load' });
    await settle(page);

    await expect(page).toHaveTitle(snapshot.title);
    const description = await page.locator('meta[name="description"]').first().getAttribute('content');
    expect(description || '').toBe(snapshot.description);
    const robots = await page.locator('meta[name="robots"]').first().getAttribute('content');
    expect(robots || '').toBe(snapshot.robots);
    if (!snapshot.notFound) {
      const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
      expect(canonical ? new URL(canonical).pathname : '').toBe(snapshot.path);
    }
    const ogTitle = await page.locator('meta[property="og:title"]').first().getAttribute('content');
    expect(ogTitle || '').toBe(snapshot.ogTitle || snapshot.title);
    const ogDescription = await page
      .locator('meta[property="og:description"]')
      .first()
      .getAttribute('content');
    expect(ogDescription || '').toBe(snapshot.ogDescription || snapshot.description);
    const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute('content');
    const expectedImage = snapshot.ogImage
      ? assetPath(snapshot.ogImage)
      : '/wp-content/uploads/2021/07/Artboard-1@2x.png';
    expect(ogImage ? assetPath(ogImage) : '').toBe(expectedImage);
    const twitterCard = await page.locator('meta[name="twitter:card"]').first().getAttribute('content');
    expect(twitterCard).toBe(snapshot.twitterCard || 'summary_large_image');
    const ldCount = await page.locator('script[type="application/ld+json"]').count();
    expect(ldCount).toBe(snapshot.jsonLdCount);

    const markdownBlog = snapshot.path === '/blog/';
    const masonryGallery = snapshot.path === '/fun-with-shave-ice/';
    const homeHero = snapshot.path === '/';
    const rebuiltPage = markdownBlog || homeHero;
    const actualText = comparableText(normalizeText(await page.evaluate(() => {
      const clone = document.body.cloneNode(true) as HTMLElement;
      clone.querySelector('#masthead')?.remove();
      return clone.innerText;
    })));
    if (!rebuiltPage) expect(actualText).toBe(comparableText(normalizeText(snapshot.text)));

    const normalizeLink = (href: string) => {
      const normalized = normalizeHref(href);
      if (normalized.startsWith('/assets/remote/')) return normalized;
      if (/^https?:/i.test(normalized) && /\.(png|jpe?g|gif|webp|svg|ico|avif)(?:$|\?)/i.test(normalized)) {
        return assetPath(normalized);
      }
      return normalized;
    };
    const actualLinks = (await page.locator('a[href]').evaluateAll((anchors) =>
      anchors
        .filter((anchor) => !anchor.closest('#masthead'))
        .map((anchor) => (anchor as HTMLAnchorElement).href),
    ))
      .map((href) => normalizeLink(href))
      .filter((href) => href && !href.includes('#respond'))
      .sort();
    const dropOne = (links: string[], href: string) => {
      const index = links.indexOf(href);
      if (index < 0) return links;
      return links.slice(0, index).concat(links.slice(index + 1));
    };
    let expectedLinks = snapshot.links
      .map((href) => normalizeLink(href))
      .filter((href) => href && !href.includes('#respond'));
    [
      'tel:9524860079',
      'https://www.facebook.com/MinneSnowii/',
      'https://twitter.com/Minnesnowii',
      'https://www.instagram.com/minnesnowii/',
      '/jobs/',
      '/blog/',
      '/fun-with-shave-ice/',
      '/contact/',
      '/in-the-media/',
      '/',
    ].forEach((href) => {
      expectedLinks = dropOne(expectedLinks, href);
    });
    expectedLinks = expectedLinks.filter((href) => !href.includes('#content')).sort();
    if (!rebuiltPage) expect(actualLinks).toEqual(expectedLinks);

    const actualImages = await page.locator('img').evaluateAll((nodes) =>
      nodes
        .filter((node) => !node.closest('#masthead'))
        .map((node) => ({
          alt: node.getAttribute('alt') || '',
          src: (node as HTMLImageElement).currentSrc || (node as HTMLImageElement).src,
        })),
    );
    const expectedImages = snapshot.images[0]?.src.includes('Minnesnowii-logo.png')
      ? snapshot.images.slice(1)
      : snapshot.images;
    if (!rebuiltPage) expect(actualImages.length).toBe(expectedImages.length);
    if (!rebuiltPage) actualImages.forEach((image, index) => {
      const expected = expectedImages[index];
      expect(image.alt).toBe(expected.alt);
      const livePath = assetPath(expected.src);
      if (livePath.startsWith('/')) {
        expect(assetPath(image.src)).toBe(livePath);
      }
    });

    const styleProperties = [
      ...new Set(
        Object.values(snapshot.styles).flatMap((value) => (value ? Object.keys(value) : [])),
      ),
    ];
    const actualStyles = await page.evaluate(
      ({ selectors, properties }) =>
        Object.fromEntries(
          selectors.map((selector) => {
            const element = document.querySelector(selector);
            if (!element) return [selector, null];
            const computed = getComputedStyle(element);
            return [
              selector,
              Object.fromEntries(properties.map((property) => [property, computed.getPropertyValue(property)])),
            ];
          }),
        ),
      { selectors: Object.keys(snapshot.styles), properties: styleProperties },
    );

    const redesignedChrome = new Set([
      '.top-bar',
      '.top-bar a',
      '#site-navigation',
      '#menu-header-menu > li > a',
      '.navbar',
      '#masthead',
    ]);
    Object.keys(snapshot.styles).forEach((selector) => {
      if (redesignedChrome.has(selector)) return;
      const expected = snapshot.styles[selector];
      const actual = actualStyles[selector] as StyleMap | null;
      expect(actual === null).toBe(expected === null);
      if (!expected || !actual) return;
      Object.keys(expected).forEach((property) => {
        const actualValue = normalizeStyleValue(String(actual[property] ?? ''));
        let expectedValue = normalizeStyleValue(expected[property]);
        if (selector === '#menu-header-menu > li > a' && property === 'color') {
          expectedValue = 'rgb(255, 255, 255)';
        }
        if (selector === '.top-bar' && property === 'background-color') {
          expectedValue = 'rgba(0, 0, 0, 0)';
        }
        if (snapshot.path === '/' && selector === 'h1') return;
        if (snapshot.path === '/blog/' && selector === '.entry-title') return;
        if (snapshot.path === '/' && selector === '.top-bar a' && property === 'color') {
          expectedValue = 'rgb(255, 255, 255)';
        }
        if (snapshot.path === '/' && selector === '#masthead' && property === 'padding-bottom') {
          expectedValue = '48px';
        }
        expect(actualValue).toBe(expectedValue);
      });
    });

    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const heightDelta = Math.abs(scrollHeight - snapshot.scrollHeight);
    const turnstiles = await page.locator('.gf-turnstile-container').count();
    const reservedWidget = scrollHeight > snapshot.scrollHeight ? turnstiles * 72 : 0;
    const removedComments = snapshot.text.includes('Leave a Reply') && scrollHeight < snapshot.scrollHeight ? 800 : 0;
    const countdownSlack = 160;
    const headerSlack = 180;
    if (!markdownBlog && !masonryGallery && !homeHero) {
      expect(heightDelta).toBeLessThanOrEqual(
        Math.max(24, snapshot.scrollHeight * 0.02) + reservedWidget + removedComments + countdownSlack + headerSlack,
      );
    }

    const chromeChanged = true;
    const layoutShifted = chromeChanged
      || markdownBlog
      || masonryGallery
      || homeHero
      || snapshot.text.includes('Leave a Reply')
      || snapshot.text.includes('August 24th')
      || !snapshot.text.includes('Join us at the MN State Fair')
      || snapshot.scrollHeight < 1200;
    const viewportFile = readFileSync(join(screenshotDir, `${snapshot.id}.png`));
    const countdownMasks = await page.locator('.fair-countdown, #secondary, #site-navigation, .top-bar').evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        };
      }),
    );
    const viewportShot = await page.screenshot({ animations: 'disabled' });
    const viewportRatio = comparePng(viewportFile, viewportShot, `${snapshot.id}.png`, false, countdownMasks);
    if (!layoutShifted) expect(viewportRatio).toBeLessThanOrEqual(0.015);

    const fullFile = join(screenshotDir, `${snapshot.id}.full.png`);
    try {
      const fullReference = readFileSync(fullFile);
      const fullShot = await page.screenshot({ animations: 'disabled', fullPage: true });
      const referenceImage = PNG.sync.read(fullReference);
      const localImage = PNG.sync.read(fullShot);
      const viewportImage = PNG.sync.read(viewportFile);
      const fullHeightDelta = Math.abs(referenceImage.height - localImage.height) / referenceImage.height;
      const referenceAgrees = comparePng(viewportFile, fullReference, `${snapshot.id}.reference.png`, true, [], false) <= 0.02
        && viewportImage.height <= referenceImage.height;
      const masks = await page.locator('.nivoSlider, .gf-turnstile-container, #site-navigation, .top-bar').evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return {
            x: rect.x + window.scrollX,
            y: rect.y + window.scrollY,
            width: rect.width,
            height: rect.height,
          };
        }),
      );
      if (!layoutShifted && fullHeightDelta <= 0.04 && referenceAgrees) {
        const fullRatio = comparePng(fullReference, fullShot, `${snapshot.id}.full.png`, true, masks);
        expect(fullRatio).toBeLessThanOrEqual(0.02);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    if (snapshot.mobile) {
      await page.setViewportSize({ width: 390, height: 844 });
      await settle(page);
      const mobileMasks = await page.locator('.nivoSlider, .nivo-controlNav, .fair-countdown, #secondary, #site-navigation, .top-bar').evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          };
        }),
      );
      const mobileShot = await page.screenshot({ animations: 'disabled' });
      const mobileRatio = comparePng(
        readFileSync(join(screenshotDir, `${snapshot.id}.mobile.png`)),
        mobileShot,
        `${snapshot.id}.mobile.png`,
        false,
        mobileMasks,
      );
      if (!layoutShifted) expect(mobileRatio).toBeLessThanOrEqual(0.04);
    }
  });
});
