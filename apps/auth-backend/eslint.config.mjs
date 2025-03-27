import createConfig from '@roll-your-own-auth/eslint-config/create-config';
import drizzle from 'eslint-plugin-drizzle';

export default createConfig({
  ignores: ['drizzle/**', '**/drizzle/**', './drizzle/**'],
  plugins: { drizzle },
  rules: {
    ...drizzle.configs.recommended.rules,
  },
});
