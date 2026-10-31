import { FAIR_RANGE } from './fair';

const MARKER = '<!--FAIR_COUNTDOWN-->';

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

function replaceElement(html: string, openRe: RegExp, replacement: string): string {
  const match = openRe.exec(html);
  if (!match) return html;
  const end = endOfElement(html, match.index);
  if (end < 0) return html;
  return html.slice(0, match.index) + replacement + html.slice(end);
}

function stripCommentSystem(html: string): string {
  return html
    .replace(/<div id="comments" class="comments-area">[\s\S]*?<!-- #comments -->/gi, '')
    .replace(/(?:\s|&nbsp;)*\|(?:\s|&nbsp;)*<span class="comments-link">[\s\S]*?<\/a>\s*<\/span>/gi, '');
}

function replaceSidebarCountdown(html: string): string {
  return replaceElement(html, /<aside\b[^>]*\bid="countdowntimer-2"[^>]*>/i, MARKER);
}

function replaceInlineCountdown(html: string): string {
  const openRe = /<div\b[^>]*class="[^"]*\btminus_countdown\b[^"]*"[^>]*>/i;
  const match = openRe.exec(html);
  if (!match) return html;
  const end = endOfElement(html, match.index);
  if (end < 0) return html;
  const rest = html.slice(end).replace(
    /^\s*<h2\b[^>]*>\s*Join us at the MN State Fair!\s*<\/h2>\s*<div\b[^>]*class="[^"]*\bwpb_text_column\b[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/i,
    '',
  );
  return `${html.slice(0, match.index)}${MARKER}${rest}`;
}

/** Swap the old Visual Composer State Fair counter row for the shared FairCountdown. */
function replaceStateFairCounter(html: string): string {
  const counter = /class="[^"]*\bstateFairCounter\b[^"]*"/i.exec(html);
  if (!counter) return html;
  const rowOpen = html.lastIndexOf('<div class="vc_row', counter.index);
  if (rowOpen < 0) return html;
  const rowEnd = endOfElement(html, rowOpen);
  if (rowEnd < 0) return html;
  return `${html.slice(0, rowOpen)}${MARKER}${html.slice(rowEnd)}`;
}

function ensureCountdown(html: string): string {
  if (html.includes(MARKER)) return html;
  const footerAt = html.indexOf('<footer id="colophon"');
  if (footerAt === -1) return `${html}${MARKER}`;
  return `${html.slice(0, footerAt)}${MARKER}${html.slice(footerAt)}`;
}

function extractContent(html: string): string {
  const start = html.search(/<div\b[^>]*\bid="content"[^>]*>/i);
  if (start < 0) return html;
  const end = endOfElement(html, start);
  if (end < 0) return html.slice(start);
  return html.slice(start, end);
}

export function preparePageHtml(html: string): string[] {
  const dated = html.replace(
    /August 24th\s*[–—-]\s*September 4th/g,
    FAIR_RANGE,
  );
  const withoutComments = stripCommentSystem(dated);
  const withSidebar = replaceSidebarCountdown(withoutComments);
  const withInline = replaceInlineCountdown(withSidebar);
  const withStateFair = replaceStateFairCounter(withInline);
  let content = extractContent(ensureCountdown(withStateFair)).replace(
    /class="([^"]*\bgform_button\b[^"]*)"/g,
    (match, classes: string) => (classes.split(/\s+/).includes('btn') ? match : `class="${classes} btn"`),
  );
  if (!content.includes(MARKER)) content = `${content}${MARKER}`;
  return content.split(MARKER);
}
