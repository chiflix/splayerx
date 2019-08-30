import electron from 'electron';
import osLocale from 'os-locale';
import { join } from 'path';
import { readFileSync } from 'fs';
import { isMacintosh, isElectronRenderer } from './platform';
import messages from '../../renderer/locales/index';

export default class Locale {
  private _displayLanguage: string;

  public get displayLanguage(): string {
    return this._displayLanguage;
  }

  public constructor() {
    this.getDisplayLanguage();
  }

  public $t(msg: string): string {
    if (!this._displayLanguage) this.getDisplayLanguage();
    const msgArray = msg.split('.');
    const result = msgArray.reduce(
      (result, prop): string | object => {
        if (result[prop]) return result[prop];
        return result;
      },
      messages[this._displayLanguage],
    );
    return typeof result === 'string' ? result : msg;
  }

  public getDisplayLanguage() {
    const { app } = isElectronRenderer ? electron.remote : electron;
    const preferencesPath = join(app.getPath('userData'), 'storage', 'preferences.json');
    let data;
    try {
      const jsonString = readFileSync(preferencesPath) as unknown as string;
      data = JSON.parse(jsonString);
    } catch (err) {
      data = {};
    }
    if (data && data.displayLanguage) {
      if (data.displayLanguage === 'zh-TW' || data.displayLanguage === 'zh-HK' || data.displayLanguage === 'zh-Hant') {
        data.displayLanguage = 'zh-Hant';
      } else if (data.displayLanguage.startsWith('zh')) {
        data.displayLanguage = 'zh-Hans';
      }
      this._displayLanguage = data.displayLanguage;
    } else {
      this._displayLanguage = this.getSystemLocale();
    }
  }

  private getSystemLocale(): string {
    const { app } = isElectronRenderer ? electron.remote : electron;
    let locale = isMacintosh ? osLocale.sync() : app.getLocale();
    locale = locale.replace('_', '-');
    if (locale === 'zh-TW' || locale === 'zh-HK' || locale === 'zh-Hant') {
      return 'zh-Hant';
    }
    if (locale.startsWith('zh')) {
      return 'zh-Hans';
    }
    return 'en';
  }
}
