import eslint from '@eslint/js'
import babelParser from '@babel/eslint-parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', 'tsconfig.tsbuildinfo'],
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly' },
    },
  },
  eslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: { parserOpts: { plugins: [['typescript', { isTSX: true }], 'jsx'] } },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Babel parse la syntaxe TS/JSX, tandis que le typecheck couvre les
      // règles sémantiques de TypeScript (imports de types, types DOM, etc.).
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Suite compilateur React (set-state-in-effect, purity, …) : non activée.
      // Elle n’était pas en vigueur avant la migration ; l’activer d’un coup
      // exigerait des choix de dépendances d’effet, hors périmètre.
      'react-hooks/set-state-in-effect': 'off',
      // 11 avertissements : exports annexes des primitives shadcn (buttonVariants, etc.).
      'react-refresh/only-export-components': 'warn',
    },
  },
]
