import { names, codes } from './allLanguages';

export function codeNormalizer(code) {
  const resultArray = Object.keys(codes).filter(name => codes[name].includes(code));
  return resultArray.length ? resultArray[0] : 'none';
}

export function codeToLanguageName(code) {
  const standardCode = codeNormalizer(code);
  return standardCode === 'none' ? 'none' : names[standardCode];
}
