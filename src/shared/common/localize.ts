import messages from '@/locales/index';
import syncStorage from '@/helpers/syncStorage';
import electron from 'electron';
import osLocale from 'os-locale';
import { IsMacintosh } from './platform';

const isElectronRenderer = (typeof process !== 'undefined' && typeof process.versions !== 'undefined' && typeof process.versions.electron !== 'undefined' && process.type === 'renderer');

export function getSystemLocale(): string {
  const { app } = isElectronRenderer ? electron.remote : electron;
  let locale = IsMacintosh ? osLocale.sync() : app.getLocale();
  locale = locale.replace('_', '-');
  if (locale === 'zh-TW' || locale === 'zh-HK' || locale === 'zh-Hant') {
    return 'zh-Hant';
  }
  if (locale.startsWith('zh')) {
    return 'zh-Hans';
  }
  return 'en';
}

export function $t(msg: string): string {
  const data = syncStorage.getSync('preferences');
  const locale = data.displayLanguage ? data.displayLanguage : getSystemLocale();
  const msgArray = msg.split('.');
  const result = msgArray.reduce(
    (result, prop): string | object => {
      if (result[prop]) return result[prop];
      return result;
    },
    messages[locale],
  );
  return typeof result === 'string' ? result : msg;
}
