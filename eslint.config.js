import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Feature-Sliced Design: a layer imports only lower layers, other slices only via index.ts.
const LAYERS = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'];
const SLICED = ['entities', 'features', 'widgets', 'pages'];

const publicApiOnly = {
  group: [...SLICED.map((l) => `@/${l}/*/**`), '@/shared/*/**'],
  message: 'Импортируйте слайс через его public API (index.ts), а не внутренние файлы.',
};

const layerRules = LAYERS.map((layer, i) => {
  const upper = LAYERS.slice(i + 1);
  const patterns = [publicApiOnly];
  if (upper.length > 0) {
    patterns.push({
      group: upper.flatMap((l) => [`@/${l}`, `@/${l}/**`]),
      message: `Слой «${layer}» не может импортировать вышележащие слои (${upper.join(', ')}).`,
    });
  }
  return {
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: { 'no-restricted-imports': ['error', { patterns }] },
  };
});

export default tseslint.config(
  { ignores: ['dist', 'public/mockServiceWorker.js', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  ...layerRules,
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/mocks/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
