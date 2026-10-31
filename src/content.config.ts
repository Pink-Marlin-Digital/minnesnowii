import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    dateLabel: z.string(),
    hero: z.string(),
    excerpt: z.string(),
    cardImage: z.string(),
    cardAlt: z.string(),
    category: z.string(),
    categoryPath: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
