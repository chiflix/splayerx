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
function getFileName(key) {
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
function getSync(key): unknown {
  const filename = getFileName(key);
  // then fs.readFile
  let data;
  try {
    data = fs.readFileSync(filename);
  } catch (err) {
    if (err instanceof Error) {
      if (err.code === 'ENOENT') {
        data = JSON.stringify({});
      } else {
        log.warn('syncStorage', err);
        addBubble(err.code);
        // throw err;
      }
    }
  }
  let objectJson = {};
  // then parseJsonObject from last step
  try {
    objectJson = JSON.parse(data);
  } catch (error) {
    // empty
  }

  return objectJson;
}
function setSync(key, json) {
  const filename = getFileName(key);
  const data = JSON.stringify(json);

  if (!data) {
    return Error('Invalid JSON data');
  }
  try {
    fs.mkdirSync(path.dirname(filename));
  } catch (err) {
    if (err instanceof Error) {
      if (err.code !== 'EEXIST') {
        log.warn('syncStorage', err);
        addBubble(err.code);
      }
    }
  } finally {
    fs.writeFileSync(filename, data);
  }

  return 1;
}
export default {
  getSync,
  setSync,
};
