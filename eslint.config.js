// ESLint flat config for Next.js (ESLint v9+)
import next from 'eslint-config-next';

export default [
  {
    ignores: [
      'node_modules',
      '.next',
      'dist',
      'build',
      'coverage',
      'playwright-report',
      'test-results',
      '*.config.js',
      '*.config.cjs'
    ]
  },
  ...next,
  {
    rules: {
      // Relax overly strict rules introduced with React Compiler/Next 16 defaults
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // Temporarily disable while codebase is migrated
      'react/no-unescaped-entities': 'off'
    }
  }
];

