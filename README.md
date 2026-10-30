# Minnesnowii

Static Astro clone of [minnesnowii.com](https://minnesnowii.com). Pages, links, images, and styles are mirrored from the live WordPress site and pre-rendered for Netlify.

```bash
pnpm install
pnpm scrape
pnpm dev
pnpm test:visual
```

`pnpm scrape` refreshes `src/data` and `public` from the live site. `pnpm test:visual` builds the site and compares each page with the captured reference.
