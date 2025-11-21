/*
 * @Author: Libra
 * @Date: 2024-10-07 00:28:07
 * @LastEditors: Libra
 * @Description:
 */
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    '@electron-toolkit/eslint-config-ts/recommended',
    '@electron-toolkit/eslint-config-prettier'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off'
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@', './src'],
          ['@main', './src/main'],
          ['@renderer', './src/renderer/src'],
          ['@preload', './src/preload'],
          ['@shared', './src/shared']
        ],
        extensions: ['.ts', '.js', '.jsx', '.json']
      }
    }
  }
}
