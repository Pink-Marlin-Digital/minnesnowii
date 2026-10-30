# Layouts

Layouts are page-level components that define the overall structure and arrangement of content on a page. They provide the skeleton that organisms, molecules, and atoms fill in.

## Purpose

Layouts define the high-level structure of pages, including common elements like headers, footers, sidebars, and main content areas. They ensure consistency across pages while allowing flexibility for page-specific content.

## Usage Guidelines

1. **Define page structure**: Layouts should define the overall page structure
2. **Include common elements**: Headers, footers, and navigation are typically part of layouts
3. **Use Astro layouts**: In Astro, layouts are typically `.astro` files that wrap page content
4. **Accept slots**: Layouts should accept content slots for page-specific content
5. **Use TypeScript**: Layout props should be properly typed
6. **Style with Tailwind**: Use Tailwind utility classes, never inline styles
7. **Consider SEO**: Include SEO metadata in layouts

## File Structure

Layouts can be either Astro files or React components:

```
layouts/
  BaseLayout.astro
  PageLayout.astro
  DashboardLayout.tsx (if using React)
```

## Example Astro Layout

```astro
---
// layouts/BaseLayout.astro
import { Header } from '../organisms/Header/Header';
import { Footer } from '../organisms/Footer/Footer';
import siteConfig from '../../config/site.json';

interface Props {
  title?: string;
  description?: string;
}

const { title = siteConfig.title, description = siteConfig.description } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title}</title>
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

## Example Usage in Page

```astro
---
// pages/about.astro
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="About Us" description="Learn more about our company">
  <section class="container mx-auto px-4 py-12">
    <h1>About Us</h1>
    <p>Content here...</p>
  </section>
</BaseLayout>
```

## When to Create a New Layout

Create a new layout when:
- You need a different page structure (e.g., dashboard vs. marketing page)
- You need to wrap pages with different headers/footers
- You need a different layout for authenticated vs. public pages

## When NOT to Create a Layout

Don't create a layout for:
- Simple page sections (use organisms)
- Reusable content blocks (use organisms)
- Components that don't define page structure

