// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

const site = process.env.CONTEXT === 'production'
  ? process.env.URL || 'https://minnesnowii.com'
  : process.env.DEPLOY_PRIME_URL || process.env.URL || 'https://minnesnowii.com';

// https://astro.build/config
export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !/\/hero-[123]\/?$/.test(page),
    }),
  ],
});
