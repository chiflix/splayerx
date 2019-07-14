/**
 * The file enables `@/store/index.js` to import all vuex modules
 * in a one-shot manner. There should not be any reason to edit this file.
 */

const files = require.context('.', true, /^\.\/\w+(\/index)?\.[j|t]s$/);
const modules = {};

files.keys().forEach((key) => {
  if (key === './index.js' || key === './Subtitle.ts') return;
  modules[key.replace(/(\.\/|(\/\w+)?\.[j|t]s)/g, '')] = files(key).default;
});
export default modules;
