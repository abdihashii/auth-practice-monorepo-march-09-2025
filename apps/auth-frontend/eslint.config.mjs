import createConfig from '@roll-your-own-auth/eslint-config/create-config';
import pluginRouter from '@tanstack/eslint-plugin-router';

export default createConfig({
  ignores: ['dist/**', 'public/**', 'src/components/ui/**'],
  plugins: { router: pluginRouter },
  rules: {
    ...pluginRouter.configs['flat/recommended'].rules,
  },
});
