import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt()(
  {
    extends: [
      'plugin:nuxt/recommended'
    ],
  });
