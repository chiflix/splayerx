import manifest from '../../package.json';

let validVideoExtensions;
export function getValidVideoExtensions() {
  if (validVideoExtensions) return validVideoExtensions;
  validVideoExtensions = manifest.build[process.platform === 'darwin' ? 'mac' : 'win']
    .fileAssociations.reduce((exts, fa) => exts.concat(fa.ext), []);
  return validVideoExtensions;
}

let validVideoRegex;
export function getValidVideoRegex() {
  if (validVideoRegex) return validVideoRegex;
  validVideoRegex = new RegExp(`\\.(${getValidVideoExtensions().join('|')})$`, 'i');
  return validVideoRegex;
}

export default {
  getValidVideoExtensions,
  getValidVideoRegex,
};
