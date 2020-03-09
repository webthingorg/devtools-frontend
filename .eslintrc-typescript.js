const rootConfig = require('./.eslintrc.js');

module.exports = {
  ...rootConfig,
  'parser': '@typescript-eslint/parser',

  'plugins': [
    ...rootConfig.plugins,
    '@typescript-eslint',
  ],

  'rules': {
    ...rootConfig.rules,
    '@typescript-eslint/explicit-member-accessibility': [2, {'accessibility': 'no-public'}],
    'comma-dangle': [2, 'always-multiline'],
    '@typescript-eslint/no-unused-vars': [2],
    '@typescript-eslint/interface-name-prefix': [2, {'prefixWithI': 'never'}],
    '@typescript-eslint/explicit-member-accessibility': [0],
  }
}
