# Site Configuration

This directory contains site-wide configuration data that should be used consistently across the entire application.

## Purpose

The site configuration file (`site.json`) centralizes all site-wide data to ensure consistency and make updates easier. This includes SEO metadata, business information, social links, and other global settings.

## File: `site.json`

The `site.json` file contains:

- **Site Information**: Name, description, base URL
- **Brand Information**: Company name, slogan, logo paths
- **Business Information**: NAP (Name, Address, Phone), business hours
- **Social Links**: URLs for social media profiles
- **SEO Defaults**: Default title, description, Open Graph settings

## Usage Guidelines

1. **Import and use**: Always import `site.json` when you need site-wide data
2. **Never hard-code**: Don't hard-code information that exists in the config
3. **Keep it updated**: Update the config when business information changes
4. **Use in SEO**: Always use config data for meta tags, schema.org markup, etc.

## Example Usage

### In Astro Pages

```astro
---
// pages/index.astro
import siteConfig from '../config/site.json';
---

<html lang="en">
  <head>
    <title>{siteConfig.title}</title>
    <meta name="description" content={siteConfig.description} />
  </head>
  <body>
    <h1>{siteConfig.siteName}</h1>
    <p>{siteConfig.brand.slogan}</p>
  </body>
</html>
```

### In React Components

```tsx
// components/organisms/Footer/Footer.tsx
import siteConfig from '../../../config/site.json';

export const Footer = () => {
  return (
    <footer>
      <p>{siteConfig.business.name}</p>
      <p>{siteConfig.business.address}</p>
      <p>{siteConfig.business.phone}</p>
      <div>
        {siteConfig.social.map((social) => (
          <a key={social.platform} href={social.url}>
            {social.platform}
          </a>
        ))}
      </div>
    </footer>
  );
};
```

### In Schema.org JSON-LD

```astro
---
import siteConfig from '../config/site.json';
---

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": siteConfig.business.name,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": siteConfig.business.address.street,
    "addressLocality": siteConfig.business.address.city,
    "addressRegion": siteConfig.business.address.state,
    "postalCode": siteConfig.business.address.zip
  },
  "telephone": siteConfig.business.phone
}
</script>
```

## When to Add to Config

Add to `site.json` when:
- Information is used in multiple places
- Information is part of SEO metadata
- Information is business/brand information
- Information changes infrequently

## When NOT to Add to Config

Don't add to `site.json` for:
- Page-specific content
- Frequently changing content
- User-specific data
- Environment variables (use `.env` files instead)

