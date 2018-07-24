import path from 'path';
import fs from 'fs';
import util from 'util';
import electron from 'electron';
import _ from 'lodash';

async function get(key) {
  // getFileName()
  const app = electron.remote.app || electron.app;
  const defaultPath = path.join(app.getPath('userData'), 'storage');

  if (!key) {
    throw Error('Missing key');
  }
  if (!_.isString(key) || key.trim().length === 0) {
    throw Error('Invalid key');
  }

  // Trick to prevent adding the `.json` twice
  // if the key already contains it.
  const keyFileName = `${path.basename(key, '.json')}.json`;

  // Prevent ENOENT and other similar errors when using
  // reserved characters in Windows filenames.
  // See: https://en.wikipedia.org/wiki/Filename#Reserved%5Fcharacters%5Fand%5Fwords
  const escapedFileName = encodeURIComponent(keyFileName)
    .replace(/\*/g, '-').replace(/%20/g, ' ');

  const filename = path.join(defaultPath, escapedFileName);
  // getFileName()
  // then mkdir
  const open = util.promisify(fs.open);
  // then lockFile
  // then fs.readFile
  // then parseJsonObject from last step
  // error Handle
  return filename;
}
export default {
  get,
};
