module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'plugin:astro/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    extraFileExtensions: ['.astro'],
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Allow console errors/warnings for development
    'no-console': ['error', { allow: ['warn', 'error'] }],
    
    // TypeScript handles unused vars
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    
    // Allow React in scope for JSX (React 17+ doesn't need it)
    'react/react-in-jsx-scope': 'off',
    
    // Allow TypeScript file extensions in imports
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
        js: 'never',
        jsx: 'never',
      },
    ],
    
    // Allow default exports for Astro pages/components
    'import/prefer-default-export': 'off',
    
    // Allow dev dependencies in config files
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/*.config.{js,cjs,mjs,ts}',
          '**/*.test.{js,jsx,ts,tsx}',
          '**/*.spec.{js,jsx,ts,tsx}',
        ],
      },
    ],
  },
  overrides: [
    {
      // Define the configuration for `.astro` files
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
      rules: {
        // Disable some rules that don't work well with Astro files
        'import/no-unresolved': 'off',
        'react/jsx-filename-extension': 'off',
        'react/no-unknown-property': 'off',
        'react/jsx-props-no-spreading': 'off',
        // Disable deprecated rules that don't exist in @typescript-eslint v8
        '@typescript-eslint/lines-between-class-members': 'off',
        '@typescript-eslint/no-throw-literal': 'off',
      },
    },
    {
      // Configuration for TypeScript files
      files: ['*.ts', '*.tsx'],
      rules: {
        // TypeScript-specific rules can go here
      },
    },
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.astro'],
      },
    },
  },
};

