import { instagramPosts } from '../data/instagram-posts';

const GRID_OPEN = /<div class="vc_grid-container-wrapper\b[^>]*>/;

type TileSize = 'regular' | 'tall' | 'wide' | 'feature';
type GalleryImage = { src: string; alt: string };

function endOfElement(html: string, start: number): number {
  const tagMatch = /^<(\w+)/.exec(html.slice(start));
  if (!tagMatch) return -1;
  const tag = tagMatch[1];
  const token = new RegExp(`<${tag}\\b|</${tag}>`, 'gi');
  token.lastIndex = start;
  let depth = 0;
  let match = token.exec(html);
  while (match) {
    if (match[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) return token.lastIndex;
    } else {
      depth += 1;
    }
    match = token.exec(html);
  }
  return -1;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/** Stable mix of tile sizes so the gallery looks irregular without shifting on refresh. */
function tileSize(src: string, index: number): TileSize {
  let hash = index + 1;
  for (let i = 0; i < src.length; i += 1) {
    hash = (hash * 33 + src.charCodeAt(i)) % 1000;
  }
  const roll = hash % 10;
  if (roll < 2) return 'feature';
  if (roll < 5) return 'tall';
  if (roll < 7) return 'wide';
  return 'regular';
}

function readImages(block: string): GalleryImage[] {
  const tags = block.match(/<img\b[^>]*>/gi) ?? [];
  return tags.flatMap((tag) => {
    const src = /src="([^"]+)"/.exec(tag)?.[1];
    if (!src) return [];
    const alt = /alt="([^"]*)"/.exec(tag)?.[1] ?? '';
    return [{ src, alt }];
  });
}

function masonryMarkup(block: string, leading: GalleryImage[] = []): string {
  const images = [...leading, ...readImages(block)];
  const tiles = images.map((image, index) => {
    const { src, alt } = image;
    const size = tileSize(src, index);
    const sizeClass = size === 'regular' ? '' : ` shave-tile-${size}`;
    const loading = index < 2 ? 'eager' : 'lazy';
    return `<a class="shave-tile${sizeClass}" href="${escapeAttr(src)}"><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="${loading}" decoding="async"></a>`;
  });
  return `<div class="shave-masonry">${tiles.join('')}</div>`;
}

/** Replace the frozen desktop masonry grids with a responsive tile layout. */
export function relayoutShaveIce(html: string): string {
  let result = html;
  let guard = 0;
  let firstGrid = true;
  while (guard < 8) {
    guard += 1;
    const match = GRID_OPEN.exec(result);
    if (!match) break;
    const end = endOfElement(result, match.index);
    if (end < 0) break;
    const block = result.slice(match.index, end);
    const leading = firstGrid ? instagramPosts : [];
    firstGrid = false;
    result = result.slice(0, match.index) + masonryMarkup(block, leading) + result.slice(end);
  }
  return result.replace(
    /(<div\b[^>]*\bdata-vc-full-width="true"[^>]*\bstyle=")([^"]*)(")/g,
    (_full, open: string, style: string, close: string) => {
      const fluid = style
        .replace(/width:\s*[\d.]+px/g, 'width: 100%')
        .replace(/left:\s*-?[\d.]+px;?/g, '');
      return `${open}${fluid}${close}`;
    },
  );
}
