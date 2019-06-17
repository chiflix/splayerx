export enum LanguageName {
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
  'id'= 'Bahasa Indonesia',
  'ar'= 'العربية',
  'hi'= 'हिन्दी',
  'No'= 'No',
};
export enum LanguageCode {
  '简体中文' =  'zh-CN',
  '繁體中文' =  'zh-TW',
  '日本語' =  'ja',
  '한국어' =  'ko',
  'English' =  'en',
  'Español' =  'es',
  'Français' =  'fr',
  'Deutsch' =  'de',
  'Italiano' =  'it',
  'Português' =  'pt',
  'čeština' =  'cs',
  'Русский' =  'ru',
  'Bahasa Indonesia' =  'id',
  'العربية' =  'ar',
  'हिन्दी' =  'hi',
  'No' = 'No',
};

const codes = [
 'zh-CN',
 'zh-TW',
 'ja',
 'ko',
 'en',
 'es',
 'fr',
 'de',
 'it',
 'pt',
 'cs',
 'ru',
 'id',
 'ar',
 'hi',
 'No',
];
const names = [
 '简体中文',
 '繁體中文',
 '日本語',
 '한국어',
 'English',
 'Español',
 'Français',
 'Deutsch',
 'Italiano',
 'Português',
 'čeština',
 'Русский',
 'Bahasa Indonesia',
 'العربية',
 'हिन्दी',
 'No',
];
const allCodes = {
  'zh-CN': [
    'zh',
    'chi',
    'cmn',
    'zh-CN',
    'zhCN',
  ],
  'zh-TW': [
    'zh',
    'chi',
    'cmn',
    'zh-TW',
    'zhTW',
  ],
  ja: [
    'ja',
    'jpn',
  ],
  ko: [
    'ko',
    'kor',
  ],
  en: [
    'en',
    'eng',
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
  const result = Object.keys(allCodes).find(name => codes[name].includes(code));
  return LanguageCode[result || 'No'];
}

export function codeToLanguageName(code: string): LanguageName {
  const standardCode = normalizeCode(code);
  return LanguageName[standardCode];
}

export function codeIndex(code: string) {
  return Object.keys(allCodes).indexOf(normalizeCode(code));
}
