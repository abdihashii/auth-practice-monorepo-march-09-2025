import antfu from '@antfu/eslint-config';

export default function createConfig(options, ...userConfigs) {
  return antfu({
    type: 'app',
    react: true,
    typescript: true,
    formatters: true,
    stylistic: {
      indent: 2,
      semi: true,
      quotes: 'single',
    },
    ignores: ['.pnpm-store/*', '**/*.md', '**/tsconfig.json'],
    ...options,
  }, {
    rules: {
      'ts/no-redeclare': 'off',
      'ts/consistent-type-definitions': ['error', 'interface'],
      'no-console': ['warn'],
      'antfu/no-top-level-await': ['off'],
      'node/prefer-global/process': ['off'],
      'node/no-process-env': ['error'],
      'perfectionist/sort-imports': ['error', {
        tsconfigRootDir: '.',
      }],
      'unicorn/filename-case': ['error', {
        case: 'kebabCase',
        ignore: ['README.md'],
      }],
      'style/brace-style': ['error', '1tbs', {
        allowSingleLine: true,
      }],
      'style/arrow-parens': ['error', 'always'],
      'antfu/if-newline': ['off'],
      // 'style/max-len': ['error', {
      //   code: 40,
      //   tabWidth: 2,
      //   ignoreUrls: true,
      //   ignoreComments: false,
      //   ignoreTrailingComments: true,
      //   ignoreStrings: true,
      //   ignoreTemplateLiterals: true,
      // }],
    },
  }, ...userConfigs);
}
