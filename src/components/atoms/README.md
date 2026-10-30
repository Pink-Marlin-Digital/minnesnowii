# Atoms

Atoms are the smallest, most basic building blocks of our design system. They cannot be broken down further without losing their meaning.

## Purpose

Atoms are simple, reusable UI elements that serve a single purpose. They have no dependencies on other components and can be used independently.

## Examples

- Buttons (primary, secondary, variants)
- Input fields
- Labels
- Icons
- Text styles (headings, paragraphs, spans)
- Badges
- Links
- Images

## Usage Guidelines

1. **Keep atoms simple**: Each atom should do one thing well
2. **Make them reusable**: Design atoms to work in multiple contexts
3. **Use TypeScript**: All atoms should have proper TypeScript types
4. **Style with Tailwind**: Use Tailwind utility classes, never inline styles
5. **Test them**: Each atom should have at least a snapshot test

## File Structure

Each atom should live in its own folder:

```
atoms/
  Button/
    Button.tsx
    Button.test.tsx
    Button.stories.tsx (optional)
```

## Example Component

```tsx
// atoms/Button/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button = ({ variant = 'primary', children, onClick }: ButtonProps) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = variant === 'primary' 
    ? 'bg-blue-600 text-white hover:bg-blue-700' 
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300';
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

## When to Create a New Atom

Create a new atom when:
- You need a basic UI element that doesn't exist yet
- The element is simple and doesn't depend on other components
- The element will be reused across multiple molecules or organisms

## When NOT to Create an Atom

Don't create an atom for:
- Complex components that combine multiple elements (use a molecule)
- Components that depend on other components (use a molecule or organism)
- Page-specific components (use organisms or pages)

