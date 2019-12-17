import electron from 'electron';
import { join, dirname } from 'path';
import osLocale from 'os-locale';
import uuidv4 from 'uuid/v4';
import regedit from 'regedit';
import storage from 'electron-json-storage';
import { checkPathExist, read, write } from '../renderer/libs/file';
import { ELECTRON_CACHE_DIRNAME, TOKEN_FILE_NAME } from '../renderer/constants';
import electronBuilderConfig from '../../electron-builder.json';
import Fetcher from './Fetcher';

const app = electron.app || electron.remote.app;
const fetcher = new Fetcher({
  timeout: 20 * 1000,
});
const tokenPath = join(app.getPath(ELECTRON_CACHE_DIRNAME), TOKEN_FILE_NAME);

const subtitleExtensions = Object.freeze(
  ['srt', 'ass', 'vtt', 'ssa'].map(ext => ext.toLowerCase()),
);
export function getValidSubtitleExtensions() {
  return subtitleExtensions;
}

let validSubtitleRegex;
export function getValidSubtitleRegex() {
  if (validSubtitleRegex) return validSubtitleRegex;
  validSubtitleRegex = new RegExp(`\\.(${getValidSubtitleExtensions().join('|')})$`, 'i');
  return validSubtitleRegex;
}

let validVideoExtensions;
export function getValidVideoExtensions() {
  if (validVideoExtensions) return validVideoExtensions;
  validVideoExtensions = electronBuilderConfig[
    process.platform === 'darwin' ? 'mac' : 'win'
  ].fileAssociations.reduce((exts, fa) => {
    if (!fa || !fa.ext || !fa.ext.length) return exts;
    return exts.concat(
      fa.ext.map(x => x.toLowerCase()).filter(x => !getValidSubtitleExtensions().includes(x)),
    );
  }, []);
  validVideoExtensions = Object.freeze(validVideoExtensions);
  return validVideoExtensions;
}

let validVideoRegex;
export function getValidVideoRegex() {
  if (validVideoRegex) return validVideoRegex;
  validVideoRegex = new RegExp(`\\.(${getValidVideoExtensions().join('|')})$`, 'i');
  return validVideoRegex;
}

let allValidExtensions;
export function getAllValidExtensions() {
  if (allValidExtensions) return allValidExtensions;
  allValidExtensions = electronBuilderConfig[
    process.platform === 'darwin' ? 'mac' : 'win'
  ].fileAssociations.reduce((exts, fa) => {
    if (!fa || !fa.ext || !fa.ext.length) return exts;
    return exts.concat(fa.ext.map(x => x.toLowerCase()));
  }, []);
  allValidExtensions = Object.freeze(allValidExtensions);
  return allValidExtensions;
}

export function getSystemLocale() {
  const { app } = electron.remote;
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
  app.getCrossThreadCache = (key) => {
    if (key instanceof Array) {
      const re = {};
      key.forEach((k) => {
        re[k] = crossThreadCache[k];
      });
      return Object.values(re).includes(undefined) ? undefined : re;
    }
    return crossThreadCache[key];
  };
  app.setCrossThreadCache = (key, val) => {
    crossThreadCache[key] = val;
  };
}
export function crossThreadCache(key, fn) {
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
export async function saveToken(nToken) {
  const token = !nToken ? '' : nToken;
  fetcher.setHeader('Authorization', `Bearer ${token}`);
  try {
    await write(tokenPath, Buffer.from(token, 'utf8'));
  } catch (error) {
    // empty
  }
  return token;
}

export async function verifyReceipt(endpoint, payment) {
  const res = await fetcher.post(`${endpoint}/api/applepay/verify`, payment);
  if (res.ok) {
    const data = await res.json();
    return data.data;
  }
  const error = new Error();
  error.status = res.status;
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

export function checkVcRedistributablePackage() {
  // https://github.com/ironSource/node-regedit/issues/60
  regedit.setExternalVBSLocation('resources/regedit/vbs');
  return new Promise((resolve) => {
    regedit.list('HKLM\\SOFTWARE\\Classes\\Installer\\Products', (err, result) => {
      if (err) resolve(false);
      const packages = result['HKLM\\SOFTWARE\\Classes\\Installer\\Products'].keys;
      // https://www.itranslater.com/qa/details/2325754613712028672
      // 64bit || 32bit
      resolve(packages.includes('1926E8D15D0BCE53481466615F760A7F') || packages.includes('1D5E3C0FEDA1E123187686FED06E995A'));
    });
  });
}
