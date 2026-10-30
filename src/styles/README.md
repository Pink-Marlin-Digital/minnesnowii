# Styles

This directory contains global styles and CSS configuration for the application.

## Purpose

The styles directory contains global CSS files, Tailwind directives, and any custom CSS that applies site-wide. This is where Tailwind CSS is initialized and where you can add custom global styles if needed.

## File: `global.css`

The `global.css` file contains:

- Tailwind CSS directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`)
- Custom CSS variables (if needed)
- Global resets or base styles (if needed)
- Custom utility classes (if needed)

## Usage Guidelines

1. **Use Tailwind first**: Always prefer Tailwind utility classes over custom CSS
2. **Avoid inline styles**: Never use inline styles in components
3. **Import globally**: Import `global.css` in your base layout or main entry point
4. **Keep it minimal**: Only add custom CSS when Tailwind utilities aren't sufficient

## Importing Global Styles

### In Astro Layout

```astro
---
// layouts/BaseLayout.astro
import '../styles/global.css';
---

<html>
  <!-- ... -->
</html>
```

### In Astro Page (if no layout)

```astro
---
// pages/index.astro
import '../styles/global.css';
---

<html>
  <!-- ... -->
</html>
```

## Tailwind Configuration

Tailwind is configured in `tailwind.config.mjs` at the root of the project. This file defines:

- Content paths (where Tailwind should look for classes)
- Theme extensions (custom colors, spacing, etc.)
- Plugins

## Custom Styles

If you need custom styles that can't be achieved with Tailwind:

1. **First**: Check if you can extend Tailwind's theme in `tailwind.config.mjs`
2. **Second**: Add custom utility classes using `@layer utilities` in `global.css`
3. **Last resort**: Add component-specific styles (but prefer Tailwind classes)

### Example: Custom Utility Class

```css
/* styles/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

## When to Add Custom CSS

Add custom CSS when:
- Tailwind doesn't have a utility for what you need
- You need to extend Tailwind's theme
- You need global base styles or resets

## When NOT to Add Custom CSS

Don't add custom CSS for:
- Styles that can be achieved with Tailwind utilities
- Component-specific styles (use Tailwind classes in components)
- Inline styles (never use inline styles)

