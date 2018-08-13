import Promise from 'bluebird';
import storage from 'electron-json-storage';
import { UpdateInfo } from './Message.js';
Promise.promisifyAll(storage);
const updateInstalledString = 'updateInstalled#loloxdnkd';
const updateDownloadString = 'updateInstalled#loloxdnkdddksk';


export default class Storage {
  constructor() {
    this.storage = storage;
  }
  willInstall(info) {
    return new Promise((resolve) => {
      resolve(this.storage.setAsync(updateInstalledString, info.toString()));
    });
  }
  // info need be the type of UpdateInfo
  updateDownLoaded(info) {
    return new Promise((resolve) => {
      resolve(this.storage.setAsync(updateDownloadString, info.toString()));
    });
  }

  getPreviousDownload() {
    return new Promise((resolve) => {
      this.storage.getAsync(updateDownloadString).then((data) => {
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
      resolve(this.storage.setAsync(updateInstalledString, null));
    });
  }

  clearPreviousDownload() {
    return new Promise((resolve) => {
      resolve(this.storage.setAsync(updateDownloadString, null));
    });
  }

  needToNotifyUpdateInstalledOrNot() {
    return new Promise((resolve) => {
      this.storage.getAsync(updateInstalledString).then((data) => {
        if (data && Object.keys(data).length !== 0) {
          resolve(UpdateInfo.getFromStorageString(data));
        } else {
          resolve(null);
        }
      });
    });
  }
}
