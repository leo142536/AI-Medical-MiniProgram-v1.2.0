module.exports = [
  {
    ignores: ['node_modules/**', 'cloudfunctions/quickstartFunctions/node_modules/**'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        wx: 'readonly',
        App: 'readonly',
        Page: 'readonly',
        getApp: 'readonly',
        Component: 'readonly',
        requirePlugin: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    plugins: {},
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'no-console': 'off'
    }
  }
]; 