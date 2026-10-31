import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(readFileSync(join(root, 'src/data/manifest.json'), 'utf8'));
const posts = manifest.filter((page) => page.bodyClass.includes('single-post'));
const outDir = join(root, 'src/content/blog');
mkdirSync(outDir, { recursive: true });

function decode(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\u2014/g, ',')
    .replace(/\u2013/g, '-');
}

function attr(source, name) {
  const match = source.match(new RegExp(`${name}=(['"])(.*?)\\1`, 'i'));
  return match ? decode(match[2]) : '';
}

function plain(html) {
  return decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function inlineMarkdown(html) {
  let source = html;
  source = source.replace(/<a\b[^>]*href=(['"])(.*?)\1[^>]*>\s*<img\b([^>]*?)>\s*<\/a>/gi, (_full, _quote, href, img) => (
    `[![${attr(img, 'alt')}](${attr(img, 'src')})](${decode(href)})`
  ));
  source = source.replace(/<img\b([^>]*?)>/gi, (_full, img) => `![${attr(img, 'alt')}](${attr(img, 'src')})`);
  source = source.replace(/<br\s*\/?>/gi, '\n');
  source = source.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**');
  source = source.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*');
  source = source.replace(/<a\b[^>]*href=(['"])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (_full, _quote, href, text) => (
    `[${plain(text)}](${decode(href)})`
  ));
  source = source.replace(/<[^>]+>/g, '');
  return decode(source).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function quote(value) {
  return JSON.stringify(value ?? '');
}

posts.forEach((page) => {
  const html = readFileSync(join(root, 'src/data/html', `${page.id}.html`), 'utf8');
  const slug = page.path.replace(/^\/|\/$/g, '');
  const title = plain((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [, page.title])[1]);
  const heroMatch = html.match(/background-image:\s*url\(([^)]+)\)/i);
  const hero = heroMatch ? heroMatch[1].replace(/['"]/g, '') : '';
  const dateMatch = html.match(/glyphicon-calendar"><\/span>(?:\s|&nbsp;)*([^<]+)/i);
  const dateLabel = dateMatch ? decode(dateMatch[1]).replace(/\s+/g, ' ').trim() : '';
  const monthIndex = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  };
  const dateParts = dateLabel.match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/);
  const date = dateParts
    ? `${dateParts[3]}-${monthIndex[dateParts[1].toLowerCase()] || '01'}-${dateParts[2].padStart(2, '0')}`
    : '';
  const categoryMatch = html.match(/class="cat-links"[\s\S]*?<a href="([^"]+)"[^>]*>([^<]+)<\/a>/i);
  const tagBlock = (html.match(/class="tags-links"[\s\S]*?<\/footer>/i) || [''])[0];
  const tags = [...tagBlock.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/gi)]
    .map((match) => ({ path: match[1], name: decode(match[2]).trim() }));
  const contentMatch = html.match(/<div id="xsbf-entry-content" class="entry-content">([\s\S]*?)<!-- \.after-content -->/i);
  const content = contentMatch ? contentMatch[1] : '';
  const blocks = [...content.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>|<iframe\b[^>]*>(?:[\s\S]*?<\/iframe>)?/gi)];
  const body = blocks.map((match) => {
    const block = match[0];
    const iframe = block.match(/<iframe\b[^>]*>/i);
    if (iframe) {
      return [
        '@video',
        attr(iframe[0], 'title'),
        attr(iframe[0], 'src'),
        attr(iframe[0], 'width') || '1170',
        attr(iframe[0], 'height') || '658',
      ].join(' | ');
    }
    return inlineMarkdown(block);
  }).filter(Boolean).join('\n\n');
  const firstText = plain(content).replace(/\s+/g, ' ');
  const excerpt = firstText.slice(0, 110).trim();
  const thumbnail = ((page.jsonLd || []).join(' ').match(/"thumbnailUrl":"(https?:[^"]+)"/) || [])[1] || '';
  const cardImage = thumbnail
    ? thumbnail.replace('https://minnesnowii.com', '')
    : hero || page.ogImage || '';
  const cardAlt = title;
  const lines = [
    '---',
    `title: ${quote(title)}`,
    `description: ${quote(page.description)}`,
    `date: ${quote(date)}`,
    `dateLabel: ${quote(dateLabel)}`,
    `hero: ${quote(hero)}`,
    `excerpt: ${quote(excerpt)}`,
    `cardImage: ${quote(cardImage)}`,
    `cardAlt: ${quote(cardAlt)}`,
    `category: ${quote(categoryMatch ? decode(categoryMatch[2]).trim() : 'Blog')}`,
    `categoryPath: ${quote(categoryMatch ? categoryMatch[1] : '/category/blog/')}`,
    ...(tags.length
      ? ['tags:', ...tags.map((tag) => `  - ${quote(`${tag.name}|${tag.path}`)}`)]
      : ['tags: []']),
    '---',
    '',
    body,
    '',
  ];
  writeFileSync(join(outDir, `${slug}.md`), lines.join('\n'));
});

console.log(`Wrote ${posts.length} posts to src/content/blog`);
