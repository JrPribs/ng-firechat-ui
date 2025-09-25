// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    plugins: {
      'unused-imports': unusedImports,
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      'array-element-newline': [
        'error',
        {
          multiline: true,
          minItems: 3,
        },
      ],
      'array-bracket-newline': [
        'error',
        {
          multiline: true,
          minItems: 3,
        },
      ],
      'array-bracket-spacing': ['error', 'always'],
      'brace-style': ['error', '1tbs'],
      'comma-dangle': ['error', 'never'],
      'comma-style': ['error', 'last'],
      indent: ['error', 2],
      'keyword-spacing': [
        'error',
        {
          after: true,
          before: true,
          overrides: {},
        },
      ],
      'no-console': [
        'error',
        {
          allow: ['table', 'debug', 'warn', 'error'],
        },
      ],
      'object-curly-newline': [
        'error',
        {
          multiline: true,
          minProperties: 3,
          consistent: true,
        },
      ],
      'object-curly-spacing': ['error', 'always'],
      'object-property-newline': ['error'],
      'prefer-const': 'error',
      semi: 2,
      'space-before-blocks': ['error', 'always'],
      'unused-imports/no-unused-imports': 'error',
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
);
