import { IFileStorable } from '@/services/storage/index';
import { access, readdir } from 'fs';
//@ts-ignore
import mkdirp from 'mkdirp';
//@ts-ignore
import rimraf from 'rimraf';

/** 创建目录
 * @description
 * @author tanghaixiang@xindong.com
 * @date 2019-05-21
 * @param {string} p
 * @returns {Promise<string>}
 */
function mkdir(p: string): Promise<string> {
  return new Promise((resolve, reject) => {
    mkdirp(p, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve(p);
      }
    });
  });
}

/** 检查path是否可以访问，如果不存在就创建
 * @description
 * @author tanghaixiang@xindong.com
 * @date 2019-05-21
 * @param {string} path
 * @returns {Promise<boolean>}
 */
function checkPermission(path: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    access(path, async (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          try {
            await mkdir(path);
            resolve(true);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(err);
        }
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
function readDir(p: string):Promise<string[]> {
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
function deleteDir(path: string): Promise<boolean> {
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

export class CacheFile implements IFileStorable {
  removeFile(path: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  writeFile(path: string, content: Buffer): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  /** 公开API 创建目录
   * @description CacheFile 对 IFileStorable接口的实现
   * @author tanghaixiang@xindong.com
   * @date 2019-05-21
   * @param {string} path
   * @returns {Promise<boolean>}
   * @memberof CacheFile
   */
  async createDir(path: string): Promise<boolean> {
    try {
      await mkdir(path);
      return true;
    } catch (error) {
      return false;
    }
  }

  readFile(path: string): Promise<Buffer | null> {
    throw new Error("Method not implemented.");
  }

  /** 公开API 读取目录，获得目录下的文件列表
   * @description CacheFile 对 IFileStorable接口的实现
   * @author tanghaixiang@xindong.com
   * @date 2019-05-21
   * @param {string} path
   * @returns {(Promise<string[] | null>)}
   * @memberof CacheFile
   */
  async readDir(path: string): Promise<string[] | null> {
    try {
      await checkPermission(path);
      const list = await readDir(path);
      return list;
    } catch (error) {
      return null;
    }
  }
  
  /** 公开API 删除目录
   * @description CacheFile 对 IFileStorable接口的实现
   * @author tanghaixiang@xindong.com
   * @date 2019-05-21
   * @param {string} path
   * @returns {Promise<boolean>}
   * @memberof CacheFile
   */
  async removeDir(path: string): Promise<boolean> {
    try {
      await deleteDir(path);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new CacheFile()