import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const SIM_NO_REAL_WORLD = [
  { object: 'Math', property: 'random', message: 'Use o RNG com seed do sim (rng.ts).' },
  { object: 'Date', property: 'now', message: 'sim não usa tempo real.' },
];

const FLOAT_MATH = [
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'atan2',
  'sinh',
  'cosh',
  'tanh',
  'pow',
  'sqrt',
  'cbrt',
  'hypot',
  'exp',
  'expm1',
  'log',
  'log2',
  'log10',
  'log1p',
];

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
      'no-restricted-properties': ['error', ...SIM_NO_REAL_WORLD],
    },
  },
  // Regra 5 do CLAUDE.md (determinismo): contas que podem variar entre navegadores
  // ficam fora da lógica do sim. Os testes podem usar, para conferir as tabelas.
  {
    files: ['packages/sim/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        ...SIM_NO_REAL_WORLD,
        ...FLOAT_MATH.map((property) => ({
          object: 'Math',
          property,
          message: `Math.${property} pode variar entre navegadores: use trig.ts, math.ts ou inteiros.`,
        })),
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "BinaryExpression[operator='**'], AssignmentExpression[operator='**=']",
          message: 'Potência (**) pode variar entre navegadores: use inteiros.',
        },
        {
          selector: "NewExpression[callee.name='Date']",
          message: 'sim não usa tempo real.',
        },
      ],
    },
  },
  {
    files: ['packages/game/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  prettier,
);
