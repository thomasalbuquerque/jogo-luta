import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', '*.ts', 'packages/sim/*.config.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { globals: globals.node },
  },
  // Regra 1 do CLAUDE.md: o sim não conhece navegador nem Phaser.
  {
    files: ['packages/sim/**/*.ts'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['phaser', 'phaser/*'], message: 'sim não pode importar Phaser.' },
            {
              group: ['@jogo-luta/game', '@jogo-luta/game/*'],
              message: 'sim não depende de game.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...[
          'window',
          'document',
          'navigator',
          'performance',
          'localStorage',
          'requestAnimationFrame',
        ].map((name) => ({ name, message: `sim não pode usar ${name} (navegador).` })),
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use o RNG com seed do sim.' },
        { object: 'Date', property: 'now', message: 'sim não usa tempo real.' },
      ],
    },
  },
  {
    files: ['packages/game/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  prettier,
);
