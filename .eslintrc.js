/*
 * @Description: 
 * @Author: 舌红
 * @Date: 2025-02-07 17:05:58
 * @LastEditors: 舌红
 * @LastEditTime: 2025-02-07 17:11:28
 */
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
