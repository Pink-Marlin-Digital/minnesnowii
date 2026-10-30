# Utilities

This directory contains utility functions, helpers, and shared logic that can be used across the application.

## Purpose

Utility functions provide reusable logic that doesn't belong in components. They help keep components clean and focused while promoting code reuse.

## Examples

- Date formatting functions
- String manipulation helpers
- Validation functions
- API helpers
- Data transformation utilities
- Type guards
- Constants

## Usage Guidelines

1. **Keep them pure**: Utility functions should be pure functions when possible (no side effects)
2. **Make them reusable**: Design utilities to work in multiple contexts
3. **Use TypeScript**: All utilities should be properly typed
4. **Test them**: Write unit tests for utility functions
5. **Document them**: Add JSDoc comments for complex utilities

## File Structure

Organize utilities by domain or functionality:

```
utils/
  date.ts
  string.ts
  validation.ts
  api.ts
  constants.ts
```

## Example Utility

```typescript
// utils/date.ts

/**
 * Formats a date to a readable string
 * @param date - The date to format
 * @param format - The format to use (default: 'long')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'long' = 'long'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Checks if a date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
}
```

## Example Usage

```tsx
// components/molecules/EventCard/EventCard.tsx
import { formatDate } from '../../../utils/date';

interface EventCardProps {
  title: string;
  date: Date;
}

export const EventCard = ({ title, date }: EventCardProps) => {
  return (
    <div>
      <h3>{title}</h3>
      <p>{formatDate(date, 'long')}</p>
    </div>
  );
};
```

## When to Create a Utility

Create a utility function when:
- You need logic that's used in multiple components
- The logic is complex enough to extract from a component
- The logic is testable independently
- The logic doesn't depend on React/Astro-specific features

## When NOT to Create a Utility

Don't create a utility for:
- Simple one-liners that are only used once
- Component-specific logic (keep it in the component)
- React hooks (use custom hooks instead)
- Astro-specific logic (keep it in Astro files)

