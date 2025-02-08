module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module'
  },
  rules: {},
  overrides: [
    {
      files: ['dist/**/*.js'],
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off'
      }
    }
  ]
}
