import site from '../config/site.json';

export interface PageIcon {
  rel: string;
  href: string;
  sizes?: string;
  type?: string;
}

/** Normalized SEO props for SiteLayout / Seo.astro */
export interface PageSeo {
  id: string;
  path: string;
  title: string;
  description: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageWidth?: string;
  ogImageHeight?: string;
  ogType?: string;
  ogLocale?: string;
  twitterCard?: string;
  twitterSite?: string;
  jsonLd?: string[];
  icons?: PageIcon[];
  lcpImage?: string;
  bodyClass?: string;
}

const DEFAULT_ICONS: PageIcon[] = [
  { rel: 'icon', href: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
  { rel: 'icon', href: '/wp-content/uploads/2022/01/cropped-shaved-ice-32x32.png', sizes: '32x32', type: 'image/png' },
  { rel: 'icon', href: '/wp-content/uploads/2022/01/cropped-shaved-ice-192x192.png', sizes: '192x192', type: 'image/png' },
  { rel: 'apple-touch-icon', href: '/wp-content/uploads/2022/01/cropped-shaved-ice-180x180.png' },
];

export function createPageSeo(input: {
  id: string;
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  robots?: string;
  lcpImage?: string;
  bodyClass?: string;
  jsonLd?: string[];
}): PageSeo {
  const image = input.ogImage || site.seo.defaultImage;
  return {
    id: input.id,
    path: input.path,
    title: input.title,
    description: input.description,
    robots: input.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    ogTitle: input.ogTitle || input.title,
    ogDescription: input.ogDescription || input.description,
    ogImage: image,
    ogImageWidth: '792',
    ogImageHeight: '540',
    ogType: input.ogType || 'website',
    ogLocale: 'en_US',
    twitterCard: 'summary_large_image',
    twitterSite: site.seo.twitterHandle,
    jsonLd: input.jsonLd || [],
    icons: DEFAULT_ICONS,
    lcpImage: input.lcpImage || site.brand.logo.light,
    bodyClass: input.bodyClass || 'page',
  };
}
