import electronBuilderConfig from '../../electron-builder.json';

const subtitleExtensions = Object.freeze(['srt', 'ass', 'vtt', 'ssa'].map(ext => ext.toLowerCase()));
export function getValidSubtitleExtensions() {
  return subtitleExtensions;
}

let validSubtitleRegex;
export function getValidSubtitleRegex() {
  if (validSubtitleRegex) return validSubtitleRegex;
  validSubtitleRegex = new RegExp(`\\.(${getValidSubtitleExtensions().join('|')})$`, 'i');
  return validSubtitleRegex;
}

let validVideoExtensions;
export function getValidVideoExtensions() {
  if (validVideoExtensions) return validVideoExtensions;
  validVideoExtensions = electronBuilderConfig[process.platform === 'darwin' ? 'mac' : 'win']
    .fileAssociations.reduce((exts, fa) => {
      if (!fa || !fa.ext || !fa.ext.length) return exts;
      return exts.concat(
        fa.ext.map(x => x.toLowerCase()).filter(x => !getValidSubtitleExtensions().includes(x)),
      );
    }, []);
  validVideoExtensions = Object.freeze(validVideoExtensions);
  return validVideoExtensions;
}

let validVideoRegex;
export function getValidVideoRegex() {
  if (validVideoRegex) return validVideoRegex;
  validVideoRegex = new RegExp(`\\.(${getValidVideoExtensions().join('|')})$`, 'i');
  return validVideoRegex;
}

let allValidExtensions;
export function getAllValidExtensions() {
  if (allValidExtensions) return allValidExtensions;
  allValidExtensions = electronBuilderConfig[process.platform === 'darwin' ? 'mac' : 'win']
    .fileAssociations.reduce((exts, fa) => {
      if (!fa || !fa.ext || !fa.ext.length) return exts;
      return exts.concat(
        fa.ext.map(x => x.toLowerCase()),
      );
    }, []);
  allValidExtensions = Object.freeze(allValidExtensions);
  return allValidExtensions;
}
