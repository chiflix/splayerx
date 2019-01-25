import storage from 'electron-json-storage';
import helpers from './index';

/*
  使用说明：
    在需要使用的组件中
    import asyncStorage from '@/helpers/asyncStorage';
*/
function get(key) {
  return new Promise((resolve, reject) => {
    storage.get(key, (err, data) => {
      if (err) {
        helpers.methods.addLog('error', err);
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
        helpers.methods.addLog('error', err);
        reject(err);
      }
      resolve();
    });
  });
}

export default {
  set,
  get,
};
