# Agent UI Template

A clean, well-documented Astro + React + Tailwind CSS template repository for building modern, performant websites. This template follows atomic design principles and includes comprehensive documentation for AI agents and developers.

## 🎯 Purpose

This template is designed to be the starting point for new website projects. It provides:

- **Atomic Design Structure**: Organized component hierarchy (atoms, molecules, organisms, layouts)
- **Modern Tech Stack**: Astro.js, React, TypeScript, and Tailwind CSS
- **Best Practices**: SEO-first, performance-optimized, accessible by default
- **Comprehensive Documentation**: README files in every directory to guide development

## 📋 Important: Repository Requirements

**All new sites created from this template must be stored in the [Pink-Marlin-Digital](https://github.com/Pink-Marlin-Digital) organization GitHub in a new repository.**

When creating a new project:

1. Create a new repository in the Pink-Marlin-Digital organization
2. Clone this template or use it as a starting point
3. Update the site configuration in `src/config/site.json`
4. Follow the development guidelines in this README and `CLAUDE.md`

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 📁 Project Structure

```
/
├── public/                 # Static assets (images, favicons, etc.)
├── src/
│   ├── components/        # React and Astro components
│   │   ├── atoms/         # Basic building blocks (buttons, inputs, etc.)
│   │   ├── molecules/     # Simple component groups (form groups, cards, etc.)
│   │   ├── organisms/     # Complex sections (headers, footers, hero sections)
│   │   └── layouts/       # Page-level layouts
│   ├── config/            # Site-wide configuration (site.json)
│   ├── pages/             # Astro pages (file-based routing)
│   ├── styles/            # Global styles (global.css with Tailwind)
│   └── utils/             # Utility functions and helpers
├── astro.config.mjs       # Astro configuration
├── tailwind.config.mjs    # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── CLAUDE.md              # Agent-specific rules and guidelines
```

Each directory contains a README.md file with detailed documentation about its purpose and usage patterns.

## 🎨 Styling Guidelines

### ⚠️ Critical: No Inline Styles

**Inline styles are NOT allowed in this project.** All styling must be done using Tailwind CSS utility classes.

### Tailwind CSS

This project uses Tailwind CSS for all styling. 

- **Use utility classes**: Apply Tailwind classes directly to elements
- **Compose classes**: Combine multiple utility classes for complex styles
- **Extend theme**: Add custom values in `tailwind.config.mjs` if needed
- **Custom utilities**: Add custom utility classes in `src/styles/global.css` using `@layer utilities` if necessary

### Example

```tsx
// ✅ Good - Using Tailwind classes
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
  Click me
</button>

// ❌ Bad - Using inline styles
<button style={{ padding: '1rem', backgroundColor: 'blue' }}>
  Click me
</button>
```

## 🧩 Component Development

### Atomic Design Principles

This project follows atomic design principles:

1. **Atoms**: Basic building blocks (buttons, inputs, labels)
2. **Molecules**: Simple component groups (form groups, cards)
3. **Organisms**: Complex sections (headers, footers, hero sections)
4. **Layouts**: Page-level structure

See the README files in each component directory for detailed guidelines.

### Component Structure

Each component should live in its own folder:

```
components/
  Button/
    Button.tsx
    Button.test.tsx
    Button.stories.tsx (optional)
```

### TypeScript

All components must be properly typed:

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button = ({ variant = 'primary', children, onClick }: ButtonProps) => {
  // Component implementation
};
```

## 🔧 Configuration

### Site Configuration

Site-wide data is stored in `src/config/site.json`. This includes:

- Site name, description, base URL
- Brand information
- Business information (NAP - Name, Address, Phone)
- Social media links
- SEO defaults

Always import and use this config instead of hard-coding values. See `src/config/README.md` for details.

## 📝 Development Workflow

1. **Plan First**: Review `CLAUDE.md` for agent-specific rules
2. **Create Components**: Follow atomic design principles
3. **Use Tailwind**: Apply utility classes, never inline styles
4. **Type Everything**: Use TypeScript for all components
5. **Test**: Write tests for components (snapshot tests at minimum)
6. **Build**: Ensure `pnpm build` completes without errors
7. **Lint**: Ensure `pnpm lint` passes (if configured)

## 🧪 Testing

This template is set up for testing with Vitest and React Testing Library. Each component should have at least a snapshot test.

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## 📚 Documentation

- **This README**: Project overview and quick start
- **CLAUDE.md**: Detailed rules and guidelines for AI agents
- **Component READMEs**: Purpose and usage for each component directory
- **Config README**: How to use site configuration

## 🚢 Deployment

This project builds to static files in the `dist/` directory. It can be deployed to:

- Netlify
- Vercel
- GitHub Pages
- Any static hosting service

```bash
# Build for production
pnpm build

# The dist/ directory contains the static site
```

## 📖 Learn More

- [Astro Documentation](https://docs.astro.build)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🤝 Contributing

When working with this template:

1. Follow the atomic design structure
2. Use Tailwind CSS for all styling (no inline styles)
3. Write TypeScript for all components
4. Add tests for new components
5. Update documentation as needed
6. Follow the guidelines in `CLAUDE.md`

## 📄 License

This template is for use by Pink Marlin Digital and TryMarlin.ai projects.
