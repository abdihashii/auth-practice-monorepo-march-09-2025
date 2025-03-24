import antfu from '@antfu/eslint-config';

type AntfuParams = Parameters<typeof antfu>;
type AntfuReturn = ReturnType<typeof antfu>;
type Options = AntfuParams[0];
type UserConfigs = AntfuParams[1][];

export default function createConfig(options?: Options, ...userConfigs: UserConfigs): AntfuReturn {
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
    ignores: ['.pnpm-store/*', '**/*.md'],
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
    },
  }, ...userConfigs);
}
