import {
  access, readdir, accessSync, constants, writeFile,
} from 'fs';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';

/** 创建目录
 * @description
 * @author tanghaixiang
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

/**
 * @description 同步式创建目录
 * @author tanghaixiang
 * @param {string} path
 * @returns {boolean}
 */
export function mkdirSync(path: string): boolean {
  try {
    mkdirp.sync(path);
    return true;
  } catch (error) {
    // empty
  }
  return false;
}

/** 检查path是否可以访问
 * @description
 * @author tanghaixiang
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

/**
 * @description 同步检查path是否可以访问
 * @author tanghaixiang
 * @param {string} path
 * @returns {boolean}
 */
export function checkPathExistSync(path: string): boolean {
  try {
    accessSync(path, constants.R_OK | constants.W_OK); //eslint-disable-line
    return true;
  } catch (err) {
    // empty
  }
  return false;
}

/** 读取目录
 * @description
 * @author tanghaixiang
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
 * @author tanghaixiang
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

export function write(path: string, content: Buffer): Promise<boolean> {
  return new Promise((resolve, reject) => {
    writeFile(path, content, (err: NodeJS.ErrnoException | null) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}
