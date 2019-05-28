import { access, readdir } from 'fs';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';

/** 创建目录
 * @description
 * @author tanghaixiang@xindong.com
 * @date 2019-05-21
 * @param {string} path
 * @returns {Promise<string>}
 */
export function mkdir(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    mkdirp(path, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve(path);
      }
    });
  });
}

/** 检查path是否可以访问
 * @description
 * @author tanghaixiang@xindong.com
 * @date 2019-05-22
 * @export
 * @param {string} path
 * @returns {Promise<boolean>}
 */
export function checkPathExist(path: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    access(path, async (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

/** 读取目录
 * @description
 * @author tanghaixiang@xindong.com
 * @date 2019-05-21
 * @param {string} p
 * @returns {Promise<string[]>}
 */
export function readDir(p: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    readdir(p, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

/** 删除目录
 * @description
 * @author tanghaixiang@xindong.com
 * @date 2019-05-21
 * @param {string} path
 * @returns {Promise<boolean>}
 */
export function deleteDir(path: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    rimraf(path, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}
