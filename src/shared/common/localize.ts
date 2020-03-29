import { join } from 'path';
import { isElectronRenderer } from './platform';
import messages from '../../renderer/locales/index';
import { getSystemLocale } from '../utils';

export default class Locale {
  private _displayLanguage: string;

  public get displayLanguage(): string {
    return this._displayLanguage;
  }

  public constructor() {
    this.refreshDisplayLanguage();
  }

  public $t(msg: string): string {
    if (!this._displayLanguage) this.refreshDisplayLanguage();
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

  public getDisplayLanguage(): string {
    if (!this._displayLanguage) this.refreshDisplayLanguage();
    return this._displayLanguage;
  }

  public refreshDisplayLanguage() {
    let data;
    try {
      const electron = require('electron'); // eslint-disable-line
      const { readFileSync } = require('fs'); // eslint-disable-line
      const { app } = isElectronRenderer ? electron.remote : electron;
      const preferencesPath = join(app.getPath('userData'), 'storage', 'preferences.json');
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
      this._displayLanguage = getSystemLocale();
    }
  }
}
