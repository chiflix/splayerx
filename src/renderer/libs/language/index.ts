import { LanguageNames, codes } from './allLanguages';

export function normalizeCode(code: string) {
  const result = Object.keys(codes).find(name => codes[name].includes(code));
  return result || '';
}

export function codeToLanguageName(code: string) {
  const standardCode = normalizeCode(code);
  return standardCode === '' ? '' : LanguageNames[standardCode];
}

export function codeIndex(code: string) {
  return Object.keys(codes).indexOf(normalizeCode(code));
}
