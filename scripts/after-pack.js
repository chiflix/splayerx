const fs = require('fs');

const languages = [
  'am',
  'ar',
  'bg',
  'bn',
  'ca',
  'cs',
  'da',
  'de',
  'el',
  'en-GB',
  'en-US',
  'es-419',
  'es',
  'et',
  'fa',
  'fi',
  'fil',
  'fr',
  'gu',
  'he',
  'hi',
  'hr',
  'hu',
  'id',
  'it',
  'ja',
  'kn',
  'ko',
  'lt',
  'lv',
  'ml',
  'mr',
  'ms',
  'nb',
  'nl',
  'pl',
  'pt-BR',
  'pt-PT',
  'ro',
  'ru',
  'sk',
  'sl',
  'sr',
  'sv',
  'sw',
  'ta',
  'te',
  'th',
  'tr',
  'uk',
  'vi',
  'zh-CN',
  'zh-TW',
];
// locales by https://github.com/electron/electron/pull/363/files

// https://github.com/electron-userland/electron-builder/issues/708
// https://github.com/electron/electron/issues/2484
exports.default = (context) => {
  const APP_NAME = context.packager.appInfo.productFilename;
  const APP_OUT_DIR = context.appOutDir;
  const PLATFORM = context.packager.platform.name;
  if (PLATFORM === 'mac') {
    languages.forEach((item) => {
      fs.writeFile(`${APP_OUT_DIR}/${APP_NAME}.app/Contents/Resources/${item}.lproj`, '', (err) => {
        if (err) throw err;
      });
    });
  }
};
