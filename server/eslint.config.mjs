import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // Global ignores
  {
    ignores: [
      '.husky/**',
      '.vscode/**',
      'coverage/**',
      'dist/**',
      'build/**',
      'documentation/**',
      'node_modules/**',
      'public/**',
    ],
  },

  // Base JavaScript/TypeScript rules
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Custom formatting and linting rules
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // Code Quality Rules
      'no-console': 'warn',
      'no-empty': 'off',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-duplicate-imports': 'error',

      // Formatting Rules - Line Length & Wrapping
      'max-len': [
        'error',
        {
          code: 80,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: true,
        },
      ],

      // Spacing & Indentation
      indent: ['error', 2, { SwitchCase: 1 }],
      'no-mixed-spaces-and-tabs': 'error',
      'no-trailing-spaces': 'error',

      // Quotes & Semicolons
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],

      // Comma Rules
      'comma-dangle': ['error', 'always-multiline'],
      'comma-spacing': ['error', { before: false, after: true }],
      'comma-style': ['error', 'last'],

      // Object & Array Spacing
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'computed-property-spacing': ['error', 'never'],

      // Function & Arrow Function Spacing
      'arrow-spacing': ['error', { before: true, after: true }],
      'space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
      'space-in-parens': ['error', 'never'],

      // Key-Value Spacing
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],

      // Line Management
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
      'eol-last': ['error', 'always'],
      'newline-before-return': 'error',

      // Object formatting
      'object-curly-newline': [
        'error',
        {
          ObjectExpression: { multiline: true, consistent: true },
          ObjectPattern: { multiline: true, consistent: true },
          ImportDeclaration: { multiline: true, consistent: true },
          ExportDeclaration: { multiline: true, consistent: true },
        },
      ],
    },
  },

  // TypeScript specific rules
  {
    files: ['**/*.{ts,mts,cts}'],
    rules: {
      // TypeScript-specific rules
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      // Naming conventions
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: true,
          },
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
      ],

      // Import/Export formatting
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
          fixStyle: 'separate-type-imports',
        },
      ],
    },
  },
];
