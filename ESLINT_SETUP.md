# ESLint & Prettier Setup

This project has been configured with ESLint (Airbnb style guide) and Prettier for code quality and formatting.

## What Was Configured

### ESLint
- **Airbnb Style Guide**: Industry-standard JavaScript/TypeScript style guide
- **TypeScript Support**: Full TypeScript linting with @typescript-eslint
- **React Support**: React-specific rules including hooks
- **Astro Support**: Custom configuration for .astro files

### Prettier
- **Code Formatting**: Automatic code formatting
- **Astro Plugin**: Support for formatting .astro files
- **Consistent Style**: Enforces consistent formatting across the codebase

## Available Scripts

```bash
# Check for linting errors (fails on warnings)
pnpm run lint

# Automatically fix linting issues
pnpm run lint:fix

# Format all files with Prettier
pnpm run format

# Check if files are formatted correctly
pnpm run format:check
```

## Configuration Files

- `.eslintrc.cjs` - ESLint configuration with Airbnb rules
- `.eslintignore` - Files to exclude from linting
- `.prettierrc.json` - Prettier formatting configuration
- `.prettierignore` - Files to exclude from formatting

## Key Rules

### ESLint Rules
- No console.log in production (console.warn and console.error allowed)
- No unused variables or imports
- TypeScript strict mode
- React 17+ JSX transform (no need to import React)
- Custom rules for Astro files (class attribute allowed, etc.)

### Prettier Rules
- Single quotes for strings
- Semicolons required
- 100 character line width
- 2 spaces for indentation
- Trailing commas in ES5

## Workflow Integration

### Before Committing
1. Run `pnpm run lint` to check for errors
2. Run `pnpm run format` to format your code
3. Fix any remaining issues
4. Commit your changes

### IDE Integration
Configure your IDE to:
- Run ESLint on save
- Format with Prettier on save
- Show linting errors inline

## Troubleshooting

### Peer Dependency Warnings
The installation shows some peer dependency warnings about version mismatches. These are expected and safe to ignore:
- `eslint-plugin-react-hooks@5.x` vs expected `@4.x` (newer version is compatible)
- `@typescript-eslint/*@8.x` vs expected `@7.x` (newer version is compatible)

### Astro File Issues
If you see React-specific errors in .astro files, make sure the override in `.eslintrc.cjs` is properly configured to disable those rules for .astro files.

## Next Steps

Consider adding:
- Pre-commit hooks with `husky` and `lint-staged`
- CI/CD integration to run linting on pull requests
- VSCode settings for consistent IDE configuration

