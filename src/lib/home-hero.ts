const HERO_OPEN = /<div class="vc_row wpb_row vc_row-fluid blue-gradient\b[^>]*>/;

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

function demoteHeading(hero: string): string {
  return hero.replace(/<h1\b/, '<h2').replace(/<\/h1>/, '</h2>');
}

const ICONS_OPEN = /<div class="vc_row wpb_row vc_inner\b[^>]*>/;

/**
 * Lift the original homepage hero so the title and icons can sit under the new one.
 * The centered logo is left out. Headings and icons are complete elements.
 */
export function splitHomeHero(html: string): { headings: string; icons: string; rest: string } {
  const empty = { headings: '', icons: '', rest: html };
  const match = HERO_OPEN.exec(html);
  if (!match) return empty;
  const end = endOfElement(html, match.index);
  if (end < 0) return empty;
  const hero = demoteHeading(html.slice(match.index, end));
  const rest = html.slice(0, match.index) + html.slice(end);
  const iconsMatch = ICONS_OPEN.exec(hero);
  if (!iconsMatch) return { headings: '', icons: '', rest };
  const iconsEnd = endOfElement(hero, iconsMatch.index);
  if (iconsEnd < 0) return { headings: '', icons: '', rest };
  const headings = [...hero.slice(0, iconsMatch.index).matchAll(/<h2\b[^>]*>[\s\S]*?<\/h2>/g)]
    .map((heading) => heading[0])
    .join('');
  return {
    headings,
    icons: hero.slice(iconsMatch.index, iconsEnd),
    rest,
  };
}
