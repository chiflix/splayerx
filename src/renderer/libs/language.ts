export enum LanguageCode {
  'zh-CN' = 'zh-CN',
  'zh-TW' = 'zh-TW',
  'ja' = 'ja',
  'ko' = 'ko',
  'en' = 'en',
  'es' = 'es',
  'fr' = 'fr',
  'de' = 'de',
  'it' = 'it',
  'pt' = 'pt',
  'cs' = 'cs',
  'ru' = 'ru',
  'id' = 'id',
  'ar' = 'ar',
  'hi' = 'hi',
  'No' = 'No',
  'Default' = 'Default',
};
export const allCodes = {
  en: [
    'en',
    'eng',
  ],
  'zh-CN': [
    'zh',
    'chi',
    'cmn',
    'zh-CN',
    'zhCN',
    'zh-Hans',
  ],
  'zh-TW': [
    'zh',
    'chi',
    'cmn',
    'zh-TW',
    'zhTW',
    'zh-Hant',
  ],
  ja: [
    'ja',
    'jpn',
  ],
  ko: [
    'ko',
    'kor',
  ],
  es: [
    'es',
    'spa',
  ],
  fr: [
    'fr',
    'fre',
    'fra',
  ],
  de: [
    'de',
    'ger',
    'deu',
  ],
  it: [
    'it',
    'ita',
  ],
  pt: [
    'pt',
    'por',
  ],
  cs: [
    'cs',
    'cze',
    'ces',
  ],
  ru: [
    'ru',
    'rus',
  ],
  id: [
    'id',
    'ind',
  ],
  ar: [
    'ar',
    'ara',
    'arb',
  ],
  hi: [
    'hi',
    'hin',
  ],
};
export function normalizeCode(code: string): LanguageCode {
  if (!code) return LanguageCode.Default;
  return (
    Object.keys(allCodes).find(standardCode => allCodes[standardCode].includes(code)) as LanguageCode ||
    LanguageCode.No
  );
}

enum LanguageName {
  'zh-CN'= '简体中文',
  'zh-TW'= '繁體中文',
  'ja'= '日本語',
  'ko'= '한국어',
  'en'= 'English',
  'es'= 'Español',
  'fr'= 'Français',
  'de'= 'Deutsch',
  'it'= 'Italiano',
  'pt'= 'Português',
  'cs'= 'čeština',
  'ru'= 'Русский',
  'id'= 'Indonesia',
  'ar'= 'العربية',
  'hi'= 'हिन्दी',
  'No'= 'No',
};
export function codeToLanguageName(code: string): LanguageName {
  const standardCode = normalizeCode(code);
  return LanguageName[standardCode];
}

export function codeIndex(code: string) {
  return Object.keys(allCodes).indexOf(normalizeCode(code));
}