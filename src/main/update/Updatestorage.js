import util from 'util';
import storage from 'electron-json-storage';
import { UpdateInfo } from './Message';

const updateInstalledString = 'updateInstalled#loloxdnkd';
const updateDownloadString = 'updateInstalled#loloxdnkdddksk';

export default class Storage {
  constructor() {
    this.setAsync = util.promisify(storage.set);
    this.getAsync = util.promisify(storage.get);
  }

  willInstall(info) {
    return new Promise((resolve) => {
      resolve(this.setAsync(updateInstalledString, info.toString()));
    });
  }

  // info need be the type of UpdateInfo
  updateDownLoaded(info) {
    return new Promise((resolve) => {
      resolve(this.setAsync(updateDownloadString, info.toString()));
    });
  }

  getPreviousDownload() {
    return new Promise((resolve) => {
      this.getAsync(updateDownloadString).then((data) => {
        if (data && Object.keys(data).length !== 0) {
          resolve(UpdateInfo.getFromStorageString(data));
        } else {
          resolve(null);
        }
      });
    });
  }

  clearUpdateInstalled() {
    return new Promise((resolve) => {
      resolve(this.setAsync(updateInstalledString, null));
    });
  }

  clearPreviousDownload() {
    return new Promise((resolve) => {
      resolve(this.setAsync(updateDownloadString, null));
    });
  }

  needToNotifyUpdateInstalledOrNot() {
    return new Promise((resolve) => {
      this.getAsync(updateInstalledString).then((data) => {
        if (data && Object.keys(data).length !== 0) {
          resolve(UpdateInfo.getFromStorageString(data));
        } else {
          resolve(null);
        }
      });
    });
  }
}
