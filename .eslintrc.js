module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser'
  },
  env: {
    browser: true,
    node: true
  },
  extends: [
    'plugin:vue/recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb-base'
  ],
  globals: {
    __static: true
  },
  plugins: [
    'vue'
  ],
  'rules': {
    'no-console': 0,
    'no-unused-expressions': 0,
    'no-unused-vars': 1,
    'global-require': 0,
    'import/no-unresolved': 0,
    'no-param-reassign': 0,
    'no-shadow': 0,
    'import/extensions': ['error', { js: 'never', json: 'ignorePackages', vue: 'always', scss: 'always' }],
    'import/newline-after-import': 1,
    'import/prefer-default-export': 0,
    'prefer-destructuring': ['error', { AssignmentExpression: { array: false } }],
    'no-multi-assign': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    // force the use of unix linebreak-syle
    'linebreak-style': ['error', 'unix'],
    // limit the cyclomatic complexity to 15
    'complexity': ['error', { max: 15 }],
    // allow dangling after this and super
    'no-underscore-dangle': ['error', { allowAfterThis: true, allowAfterSuper: true }],
    // allow for-of and await in for-of loop
    'no-restricted-syntax': 0,
    'no-await-in-loop': 0,
    'indent': 'off',
    '@typescript-eslint/indent': ['error', 2],
    'vue/attributes-order': ['error', {
      'order': [
        'DEFINITION',
        'LIST_RENDERING',
        'CONDITIONALS',
        'RENDER_MODIFIERS',
        'GLOBAL',
        'UNIQUE',
        'TWO_WAY_BINDING',
        'OTHER_DIRECTIVES',
        'OTHER_ATTR',
        'EVENTS',
        'CONTENT'
      ]
    }],
    // can use types to define Obejct
    '@typescript-eslint/prefer-interface': 0,
    // JSON style for interfaces && types
    '@typescript-eslint/member-delimiter-style': {
      'multiline': {
        'delimiter': 'comma',
        'requireLast': true
      },
      'singleline': {
        "delimiter": 'comma',
        'requireLast': false
      }
    },
  }
}
