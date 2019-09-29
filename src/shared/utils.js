import axios from 'axios';
import electron from 'electron';
import { join } from 'path';
import {
  checkPathExist, read, write,
} from '../renderer/libs/file';
import { ELECTRON_CACHE_DIRNAME, TOKEN_FILE_NAME } from '../renderer/constants';
import electronBuilderConfig from '../../electron-builder.json';

const app = electron.app || electron.remote.app;
const tokenPath = join(app.getPath(ELECTRON_CACHE_DIRNAME), TOKEN_FILE_NAME);

const subtitleExtensions = Object.freeze(['srt', 'ass', 'vtt', 'ssa'].map(ext => ext.toLowerCase()));
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
  validVideoExtensions = electronBuilderConfig[process.platform === 'darwin' ? 'mac' : 'win']
    .fileAssociations.reduce((exts, fa) => {
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
  allValidExtensions = electronBuilderConfig[process.platform === 'darwin' ? 'mac' : 'win']
    .fileAssociations.reduce((exts, fa) => {
      if (!fa || !fa.ext || !fa.ext.length) return exts;
      return exts.concat(
        fa.ext.map(x => x.toLowerCase()),
      );
    }, []);
  allValidExtensions = Object.freeze(allValidExtensions);
  return allValidExtensions;
}

export function getIP() {
  return new Promise((resolve, reject) => {
    axios.get('https://ip.xindong.com/myip', { responseType: 'text' })
      .then((response) => {
        resolve(response.data);
      }, (error) => {
        reject(error);
      });
  });
}

export async function getUserInfo(token) {
  axios.defaults.headers.common['X-Application-Token'] = token;
  return axios.post('');
}

export async function getToken() {
  try {
    const exist = await checkPathExist(tokenPath);
    if (exist) {
      const token = await read(tokenPath);
      if (token) {
        let displayName = '';
        try {
          displayName = JSON.parse(new Buffer(token.split('.')[1], 'base64').toString()).display_name; // eslint-disable-line
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
