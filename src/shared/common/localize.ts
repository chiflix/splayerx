import electron from 'electron';
import osLocale from 'os-locale';
import { join } from 'path';
import { readFileSync } from 'fs';
import { IsMacintosh, IsElectronRenderer } from './platform';
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

  private getDisplayLanguage() {
    const { app } = IsElectronRenderer ? electron.remote : electron;
    const preferencesPath = join(app.getPath('userData'), 'storage', 'preferences.json');
    let jsonString;
    try {
      jsonString = readFileSync(preferencesPath) as unknown as string;      
    } catch (err) {
      jsonString = '';
    }
    const data = JSON.parse(jsonString);
    if (data.displayLanguage) this._displayLanguage = data.displayLanguage;
    else this._displayLanguage = this.getSystemLocale();
  }

  private getSystemLocale(): string {
    const { app } = IsElectronRenderer ? electron.remote : electron;
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
}
