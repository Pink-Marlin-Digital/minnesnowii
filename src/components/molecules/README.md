# Molecules

Molecules are relatively simple groups of atoms functioning together as a unit. They form the next level of complexity in our atomic design system.

## Purpose

Molecules take simple atoms and combine them into more complex, but still reusable, components. They represent simple UI patterns that can be used across different contexts.

## Examples

- Form groups (label + input + error message)
- Card patterns (image + title + description + button)
- Navigation items (icon + text + link)
- Search bars (input + button)
- Testimonial blocks (quote + author + image)
- Hero CTA blocks (heading + text + button)
- Input groups (label + input + helper text)

## Usage Guidelines

1. **Compose from atoms**: Molecules should be built using atoms as building blocks
2. **Keep them focused**: Each molecule should represent a single UI pattern
3. **Make them reusable**: Design molecules to work in multiple contexts
4. **Use TypeScript**: All molecules should have proper TypeScript types
5. **Style with Tailwind**: Use Tailwind utility classes, never inline styles
6. **Test them**: Each molecule should have at least a snapshot test

## File Structure

Each molecule should live in its own folder:

```
molecules/
  FormGroup/
    FormGroup.tsx
    FormGroup.test.tsx
    FormGroup.stories.tsx (optional)
```

## Example Component

```tsx
// molecules/FormGroup/FormGroup.tsx
import { Input } from '../../atoms/Input/Input';
import { Label } from '../../atoms/Label/Label';

interface FormGroupProps {
  label: string;
  id: string;
  type?: string;
  error?: string;
  required?: boolean;
}

export const FormGroup = ({ 
  label, 
  id, 
  type = 'text', 
  error,
  required = false 
}: FormGroupProps) => {
  return (
    <div className="mb-4">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <Input 
        id={id}
        type={type}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
```

## When to Create a New Molecule

Create a new molecule when:
- You need to combine multiple atoms into a reusable pattern
- The component is still relatively simple and focused
- The pattern will be reused across multiple organisms or pages

## When NOT to Create a Molecule

Don't create a molecule for:
- Simple single-purpose elements (use an atom)
- Complex sections with multiple patterns (use an organism)
- Page-specific layouts (use organisms or pages)

