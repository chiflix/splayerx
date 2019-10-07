import electron from 'electron';
import { join } from 'path';
import osLocale from 'os-locale';
import uuidv4 from 'uuid/v4';
import storage from 'electron-json-storage';
import { checkPathExist, read, write } from '../renderer/libs/file';
import { ELECTRON_CACHE_DIRNAME, TOKEN_FILE_NAME } from '../renderer/constants';
import electronBuilderConfig from '../../electron-builder.json';
import Fetcher from './Fetcher';

const app = electron.app || electron.remote.app;
const fetcher = new Fetcher();
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
  app.getCrossThreadCache = key => crossThreadCache[key];
  app.setCrossThreadCache = (key, val) => {
    crossThreadCache[key] = val;
  };
}
function crossThreadCache(key, fn) {
  return async () => {
    let val = app.getCrossThreadCache(key);
    if (val) return val;
    val = await fn();
    app.setCrossThreadCache(key, val);
    return val;
  };
}

export const getIP = crossThreadCache('ip', async () => {
  const res = await fetcher.fetch('https://ip.xindong.com/myip');
  const ip = await res.text();
  return ip;
});

export const getClientUUID = crossThreadCache(
  'clientUUID',
  () => new Promise((resolve) => {
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

export async function getToken() {
  try {
    const exist = await checkPathExist(tokenPath);
    if (exist) {
      const token = await read(tokenPath);
      if (token) {
        let displayName = '';
        try {
          displayName = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            .display_name; // eslint-disable-line
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
  return undefined;
}

export async function saveToken(nToken) {
  const token = !nToken ? '' : nToken;
  try {
    await write(tokenPath, Buffer.from(token, 'utf8'));
  } catch (error) {
    // empty
  }
  return token;
}
