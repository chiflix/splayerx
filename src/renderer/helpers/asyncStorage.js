import path from 'path';
import storage from 'electron-json-storage';
import { promises as fsPromises } from 'fs';
import { log } from '@/libs/Log';
import { addBubble } from '@/helpers/notificationControl';

/*
  使用说明：
    在需要使用的组件中
    import asyncStorage from '@/helpers/asyncStorage';
*/
function removeAll() {
  const dirPath = storage.getDataPath();
  const taskArray = [];
  return fsPromises.readdir(dirPath).then((files) => {
    files.forEach((file) => {
      taskArray.push(new Promise((resolve) => {
        storage.remove(path.basename(file), () => {
          resolve();
        });
      }));
    });
    return Promise.all(taskArray);
  });
}
function get(key) {
  return new Promise((resolve, reject) => {
    storage.get(key, (err, data) => {
      if (err) {
        log.warn('asyncStorage', err);
        addBubble(err.code);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
function set(key, json) {
  return new Promise((resolve, reject) => {
    storage.set(key, json, (err) => {
      if (err) {
        log.warn('asyncStorage', err);
        addBubble(err.code);
        reject(err);
      }
      resolve();
    });
  });
}

export default {
  set,
  get,
  removeAll,
};
