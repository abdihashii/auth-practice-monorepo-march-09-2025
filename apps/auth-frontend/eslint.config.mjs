import pluginRouter from '@tanstack/eslint-plugin-router';

import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  ...pluginRouter.configs['flat/recommended'],
];
