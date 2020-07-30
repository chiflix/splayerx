import electron from 'electron';
import { join } from 'path';
import osLocale from 'os-locale';
import uuidv4 from 'uuid/v4';
import regedit from 'regedit';
import storage from '@splayer/electron-json-storage';
import * as platformInfo from './common/platform';
import { checkPathExist, read, write } from '../renderer/libs/file';
import { TOKEN_FILE_NAME } from '../renderer/constants';
import { videos, audios, subtitles } from '../../config/fileAssociations';
import Fetcher from './Fetcher';

const app = electron.app || electron.remote.app;

const fetcher = new Fetcher({
  timeout: 20 * 1000,
});
const tokenPath = join(app.getPath('userData'), TOKEN_FILE_NAME);

function extsToRegex(exts: string[]) {
  return new RegExp(`\\.(${exts.join('|')})$`, 'i');
}

export function getValidSubtitleExtensions() {
  return subtitles as string[];
}
let validSubtitleRegex: RegExp;
export function isSubtitle(filepath: string) {
  if (!validSubtitleRegex) validSubtitleRegex = extsToRegex(getValidSubtitleExtensions());
  return validSubtitleRegex.test(filepath);
}

export function getValidVideoExtensions() {
  return videos as string[];
}
let validVideoRegex: RegExp;
export function isVideo(filepath: string) {
  if (!validVideoRegex) validVideoRegex = extsToRegex(getValidVideoExtensions());
  return validVideoRegex.test(filepath);
}

export function getValidAudioExtensions() {
  return audios as string[];
}
let validAudioRegex: RegExp;
export function isAudio(filepath: string) {
  if (!validAudioRegex) validAudioRegex = extsToRegex(getValidAudioExtensions());
  return validAudioRegex.test(filepath);
}

export function getAllValidExtensions() {
  const exts = [] as string[];
  return exts.concat(videos, audios, subtitles);
}
export function isValidFile(file: string, type: ('video'|'audio'|'subtitle')[]): boolean {
  type = type || [];
  if (type.includes('video') && !isVideo(file)) return false;
  if (type.includes('audio') && !isAudio(file)) return false;
  if (type.includes('subtitle') && !isSubtitle(file)) return false;
  return true;
}

export function getSystemLocale() {
  const { app } = platformInfo.isElectronRenderer ? electron.remote : electron;
  let locale = process.platform === 'win32' ? app.getLocale() : osLocale.sync();
  locale = locale.replace('_', '-');
  if (locale === 'zh-TW' || locale === 'zh-HK' || locale === 'zh-Hant') {
    return 'zh-Hant';
  }
  if (locale.startsWith('zh')) {
    return 'zh-Hans';
  }
  return 'en';
}

if (process.type === 'browser') {
  const crossThreadCache = {};
  app.getCrossThreadCache = (key: string[] | string) => {
    if (key instanceof Array) {
      const re = {};
      key.forEach((k) => {
        re[k] = crossThreadCache[k];
      });
      return Object.values(re).includes(undefined) ? undefined : re;
    }
    return crossThreadCache[key];
  };
  app.setCrossThreadCache = (key: string, val: unknown) => {
    crossThreadCache[key] = val;
  };
}
export function crossThreadCache(key: string[] | string, fn: () => Promise<unknown>) {
  const func = async () => {
    if (typeof app.getCrossThreadCache !== 'function') return fn();
    let val = app.getCrossThreadCache(key);
    if (val) return val;
    val = await fn();
    if (key instanceof Array) {
      key.forEach(k => app.setCrossThreadCache(k, val[k]));
    } else {
      app.setCrossThreadCache(key, val);
    }
    return val;
  };
  func.noCache = fn;
  return func;
}

export const getIP = crossThreadCache('ip', async () => {
  const res = await fetcher.get('https://ip.xindong.com/myip');
  const ip = await res.text();
  return ip;
});

export const getClientUUID = crossThreadCache(
  'clientUUID',
  () => new Promise((resolve) => {
    if (process.env.NODE_ENV === 'testing') {
      resolve('00000000-0000-0000-0000-000000000000');
      return;
    }
    storage.get('user-uuid', (err, userUUID) => {
      if (err || Object.keys(userUUID).length === 0) {
        if (err) console.error(err);
        userUUID = uuidv4();
        storage.set('user-uuid', userUUID);
      }
      resolve(userUUID);
    });
  }),
);

/**
 * @description check local has token
 * @author tanghaixiang
 * @returns Promise
 */
export async function getToken() {
  try {
    const exist = await checkPathExist(tokenPath);
    if (exist) {
      const token = await read(tokenPath);
      if (token) {
        let displayName = '';
        fetcher.setHeader('Authorization', `Bearer ${token}`);
        try {
          displayName = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            .displayName; // eslint-disable-line
        } catch (error) {
          // tmpty
        }
        return {
          token,
          displayName,
        };
      }
    }
  } catch (error) {
    // empty
  }
  fetcher.setHeader('Authorization', '');
  return undefined;
}

/**
 * @description save token to local file
 * @author tanghaixiang
 * @param {String} nToken
 * @returns Promise<string>
 */
export async function saveToken(nToken: string) {
  const token = !nToken ? '' : nToken;
  fetcher.setHeader('Authorization', `Bearer ${token}`);
  try {
    await write(tokenPath, Buffer.from(token, 'utf8'));
  } catch (error) {
    // empty
  }
  return token;
}

export async function verifyReceipt(endpoint: string, payment: Json) {
  const res = await fetcher.post(`${endpoint}/api/applepay/verify`, payment);
  if (res.ok) {
    const data = await res.json();
    return data.data;
  }
  const error = new Error();
  error['status'] = res.status;
  throw error;
}
/**
 * @description app env
 * @author tanghaixiang
 * @returns String
 */
export function getEnvironmentName() {
  if (process.platform === 'darwin') {
    return process.mas ? 'MAS' : 'DMG';
  }
  if (process.platform === 'win32') {
    return process.windowsStore ? 'APPX' : 'EXE';
  }
  return 'Unknown';
}

export function getPlatformInfo() {
  return platformInfo;
}

export function checkVcRedistributablePackage() {
  // https://github.com/ironSource/node-regedit/issues/60
  regedit.setExternalVBSLocation('resources/regedit/vbs');
  return new Promise((resolve) => {
    regedit.list('HKLM\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall', (err, result) => {
      if (err || !result) {
        resolve(false);
        return;
      }
      const packages = result['HKLM\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall'].keys;
      // https://zzz.buzz/notes/vc-redist-packages-and-related-registry-entries/#microsoft-visual-c-2010-redistributable-vc-100
      resolve(packages.includes('{196BB40D-1578-3D01-B289-BEFC77A11A1E}'));
    });
  });
}

export function calcCurrentChannel(url: string) {
  const allChannels = ['youtube', 'bilibili', 'iqiyi', 'douyu', 'qq', 'huya', 'youku', 'twitch', 'coursera', 'ted', 'lynda', 'masterclass', 'sportsqq', 'developerapple', 'vipopen163', 'study163', 'imooc', 'icourse163'];
  const compareStr = [['youtube'], ['bilibili'], ['iqiyi'], ['douyu'], ['v.qq.com', 'film.qq.com'], ['huya'], ['youku', 'soku.com'], ['twitch'], ['coursera'], ['ted'], ['lynda'], ['masterclass'], ['sports.qq.com', 'new.qq.com', 'view.inews.qq.com'], ['apple', 'wwdc'], ['open.163'], ['study.163'], ['imooc'], ['icourse163']];
  let newChannel = '';
  allChannels.forEach((channel, index) => {
    if (compareStr[index].findIndex(str => url.includes(str)) !== -1) {
      newChannel = `${channel}.com`;
    }
  });
  return newChannel;
}

export function openExternal(url: string) {
  electron.shell.openExternal(url);
}

export function postMessage(message: string, data?: unknown) {
  const { app } = platformInfo.isElectronRenderer ? electron.remote : electron;
  app.emit(message, data);
}

app.utils = app.utils || {};
app.utils.getIP = getIP;
app.utils.getClientUUID = getClientUUID;
app.utils.getValidSubtitleExtensions = getValidSubtitleExtensions;
app.utils.getValidVideoExtensions = getValidVideoExtensions;
app.utils.getAllValidExtensions = getAllValidExtensions;
app.utils.isSubtitle = isSubtitle;
app.utils.isVideo = isVideo;
app.utils.isAudio = isAudio;
app.utils.isValidFile = isValidFile;
app.utils.getSystemLocale = getSystemLocale;
app.utils.crossThreadCache = crossThreadCache;
app.utils.getEnvironmentName = getEnvironmentName;
app.utils.getPlatformInfo = getPlatformInfo;
app.utils.checkVcRedistributablePackage = checkVcRedistributablePackage;
app.utils.calcCurrentChannel = calcCurrentChannel;
app.utils.openExternal = openExternal;
