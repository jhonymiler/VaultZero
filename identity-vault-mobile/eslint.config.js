const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    plugins: {
      'unused-imports': require('eslint-plugin-unused-imports'),
      'sonarjs': require('eslint-plugin-sonarjs'),
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' }
      ],
      ...require('eslint-plugin-sonarjs').configs.recommended.rules,  // <<< ESTE É O PULO DO GATO NO FLAT CONFIG
    }
  },
]);
