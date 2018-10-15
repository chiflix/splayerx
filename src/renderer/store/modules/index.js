/**
 * The file enables `@/store/index.js` to import all vuex modules
 * in a one-shot manner. There should not be any reason to edit this file.
 */

const files = require.context('.', false, /\.js$/);
const modules = {};

files.keys().forEach((key) => {
  if (key === './index.js') return;
  modules[key.replace(/(\.\/|\.js)/g, '')] = files(key).default;
  if (process.env.BABEL_ENV !== 'test') {
    const { validators } = files(key);
    const { state } = files(key).default;
    const stateNames = Object.keys(state);
    stateNames.forEach((stateName) => {
      if (validators && validators[stateName]) {
        const validator = validators[stateName];
        Object.defineProperty(state, stateName, {
          get: () => this[stateName],
          set: (value) => {
            if (validator(value)) {
              this[stateName] = value;
            }
          },
        });
      }
    });
  }
});

export default modules;
