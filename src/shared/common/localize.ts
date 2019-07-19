import messages from '@/locales/index'
import syncStorage from '@/helpers/syncStorage';
import electron from 'electron';
import osLocale from 'os-locale';
import { isMacintosh } from './platform';

const isElectronRenderer = (typeof process !== 'undefined' && typeof process.versions !== 'undefined' && typeof process.versions.electron !== 'undefined' && process.type === 'renderer');

export function getSystemLocale(): string {
  const { app } = isElectronRenderer ? electron.remote : electron;
  let locale = isMacintosh ? osLocale.sync(): app.getLocale();
  locale = locale.replace('_', '-');
  if (locale === 'zh-TW' || locale === 'zh-HK' || locale === 'zh-Hant') {
    return 'zh-Hant';
  }
  if (locale.startsWith('zh')) {
    return 'zh-Hans';
  }
  return 'en';
}

export function $t(msg: string): string | object {
  console.log(syncStorage);
  const data = syncStorage.getSync('preferences');
  const locale = data.displayLanguage ? data.displayLanguage : getSystemLocale();
  const msgArray = msg.split('.');
  const result = msgArray.reduce((result, prop): string | object => {
    return result[prop] ? result[prop] : result;
  }, messages[locale]);
  return typeof result === 'string' ? result : msg;
}
