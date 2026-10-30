# Organisms

Organisms are complex UI components composed of groups of molecules and/or atoms. They form distinct sections of an interface.

## Purpose

Organisms represent complete, standalone sections of a page. They combine molecules and atoms into more complex, context-specific components that form the major building blocks of pages.

## Examples

- Header (logo + navigation + CTA button)
- Footer (links + social media + copyright)
- Hero section (heading + description + CTA + image)
- Pricing section (multiple pricing cards)
- Testimonial strip (multiple testimonial blocks)
- Feature grid (multiple feature cards)
- Contact form (multiple form groups + submit button)
- Navigation menu (multiple nav items)

## Usage Guidelines

1. **Compose from molecules and atoms**: Organisms should be built using molecules and atoms
2. **Represent complete sections**: Each organism should represent a full, functional section
3. **Can be page-specific**: Organisms can be more context-specific than molecules
4. **Use TypeScript**: All organisms should have proper TypeScript types
5. **Style with Tailwind**: Use Tailwind utility classes, never inline styles
6. **Test them**: Each organism should have at least a snapshot test
7. **Consider SEO**: Use semantic HTML elements for better SEO

## File Structure

Each organism should live in its own folder:

```
organisms/
  Header/
    Header.tsx
    Header.test.tsx
    Header.stories.tsx (optional)
```

## Example Component

```tsx
// organisms/Hero/Hero.tsx
import { Button } from '../../atoms/Button/Button';

interface HeroProps {
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}

export const Hero = ({ title, description, ctaText, ctaLink }: HeroProps) => {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">{title}</h1>
        <p className="text-xl mb-8 max-w-2xl">{description}</p>
        <Button variant="primary" onClick={() => window.location.href = ctaLink}>
          {ctaText}
        </Button>
      </div>
    </section>
  );
};
```

## When to Create a New Organism

Create a new organism when:
- You need a complete, standalone section of a page
- The component combines multiple molecules and/or atoms
- The component represents a major page section (header, footer, hero, etc.)
- The component is complex enough to warrant its own file

## When NOT to Create an Organism

Don't create an organism for:
- Simple components (use atoms or molecules)
- Full page layouts (use layouts or pages)
- Components that are too specific to a single page (consider if it should be page-specific)

