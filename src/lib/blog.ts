import { getCollection, type CollectionEntry } from 'astro:content';

export interface BlogTag {
  name: string;
  path: string;
}

export interface BlogPostSummary {
  slug: string;
  title: string;
  description: string;
  date: string;
  dateLabel: string;
  hero: string;
  excerpt: string;
  cardImage: string;
  cardAlt: string;
  category: string;
  categoryPath: string;
  tags: BlogTag[];
}

function parseTags(raw: string[] | undefined): BlogTag[] {
  return (raw || []).flatMap((entry) => {
    const [name, path] = entry.split('|');
    if (!name) return [];
    return [{ name, path: path || `/blog/` }];
  });
}

function meaningfulTags(tags: BlogTag[]): BlogTag[] {
  const spam = /bar mitzvah|bat mitzvah|birthday parties|catering services|corporate food|food truck|google catering|graduation party|shaved ice$/i;
  const filtered = tags.filter((tag) => !spam.test(tag.name));
  return filtered.length > 0 ? filtered.slice(0, 8) : tags.slice(0, 6);
}

export function toSummary(entry: CollectionEntry<'blog'>): BlogPostSummary {
  const data = entry.data;
  return {
    slug: entry.id,
    title: data.title,
    description: data.description,
    date: data.date,
    dateLabel: data.dateLabel,
    hero: data.hero,
    excerpt: data.excerpt,
    cardImage: data.cardImage,
    cardAlt: data.cardAlt,
    category: data.category,
    categoryPath: '/blog/',
    tags: meaningfulTags(parseTags(data.tags)),
  };
}

export async function listPosts(): Promise<BlogPostSummary[]> {
  const entries = await getCollection('blog');
  return entries
    .map(toSummary)
    .sort((left, right) => right.date.localeCompare(left.date));
}

export async function getPostEntry(slug: string): Promise<CollectionEntry<'blog'> | undefined> {
  const entries = await getCollection('blog');
  return entries.find((entry) => entry.id === slug);
}

export async function listPostSlugs(): Promise<string[]> {
  const entries = await getCollection('blog');
  return entries.map((entry) => entry.id);
}
