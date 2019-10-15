import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import { log } from '@/libs/Log';
import { addBubble } from '@/helpers/notificationControl';

/* eslint-disable */
const electron = require('electron');
/* eslint-enable */

/*

  不要！！
  在视频播放期间！！！
  使用这两个同步函数！！！！

*/
function getFileName(key: string) {
  const app = electron.remote.app || electron.app;
  const defaultPath = path.join(app.getPath('userData'), 'storage');

  if (!key) {
    throw Error('Missing key');
  }
  if (!_.isString(key) || key.trim().length === 0) {
    throw Error('Invalid key');
  }

  const keyFileName = `${path.basename(key, '.json')}.json`;
  // Prevent ENOENT and other similar errors when using
  // reserved characters in Windows filenames.
  // See: https://en.wikipedia.org/wiki/Filename#Reserved%5Fcharacters%5Fand%5Fwords
  const escapedFileName = encodeURIComponent(keyFileName)
    .replace(/\*/g, '-').replace(/%20/g, ' ');

  const filename = path.join(defaultPath, escapedFileName);
  return filename;
}
function getSync(key: string): any { // eslint-disable-line
  const filename = getFileName(key);
  try {
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err instanceof Error) {
      const fsErr = err as NodeJS.ErrnoException;
      if (fsErr.code !== 'ENOENT') { // ENOENT for new storage
        log.warn('syncStorage', fsErr);
        addBubble(fsErr.code);
      }
    }
    return {};
  }
}
function setSync(key: string, json: unknown): boolean {
  const filename = getFileName(key);
  const data = JSON.stringify(json);

  if (!data) {
    log.warn('syncStorage.setSync', 'Empty data');
    return false;
  }
  try {
    fs.mkdirSync(path.dirname(filename));
    return true;
  } catch (err) {
    if (err instanceof Error) {
      const fsErr = err as NodeJS.ErrnoException;
      if (fsErr.code !== 'EEXIST') {
        log.warn('syncStorage', fsErr);
        addBubble(fsErr.code);
      }
    }
    return false;
  } finally {
    fs.writeFileSync(filename, data);
  }
}
export default {
  getSync,
  setSync,
};
