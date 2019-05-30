
import path, { join } from 'path';
import electron from 'electron';
import { ICacheFileStorable } from '@/interfaces/services/ICacheFileStorable';
import { ELECTRON_CACHE_DIRNAME, DEFAULT_DIRNAME, VIDEO_DIRNAME } from '@/constants';
import { mkdir, checkPathExist, readDir, deleteDir } from './file';

const app = electron.app || electron.remote.app;

/**
 * @description 获取electron应用用户目录下的设定的缓存路径
 * @author tanghaixiang@xindong.com
 * @date 2019-03-01
 * @returns String
 */
function getDefaultDataPath() {
  return path.join(app.getPath(ELECTRON_CACHE_DIRNAME), DEFAULT_DIRNAME);
}

export default class CacheFile implements ICacheFileStorable {
  /** 公开API 根据mediaHash得到该视频的缓存目录
   * @description CacheFile 对 IFileStorable接口的实现
   * @author tanghaixiang@xindong.com
   * @date 2019-05-22
   * @param {string} mediaHash
   * @returns {string} 返回改视频对应的缓存路径
   * @memberof CacheFile
   */
  getPathBy(mediaHash: string): string {
    return join(`${getDefaultDataPath()}/${VIDEO_DIRNAME}/`, mediaHash);
  }
  removeFile(path: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  readFile(path: string): Promise<Buffer | null> {
    throw new Error("Method not implemented.");
  }

  writeFile(path: string, content: Buffer): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  /** 公开API 根据mediaHash创建该视频的缓存目录
   * @description CacheFile 对 IFileStorable接口的实现
   * @author tanghaixiang@xindong.com
   * @date 2019-05-21
   * @param {string} mediaHash
   * @returns {Promise<boolean>} 成功是否成功
   * @memberof CacheFile
   */
  async createDirBy(mediaHash: string): Promise<boolean> {
    try {
      const path = join(`${getDefaultDataPath()}/${VIDEO_DIRNAME}/`, mediaHash);
      await mkdir(path);
      return true;
    } catch (error) {
      return false;
    }
  }

  /** 公开API 根据mediaHash读取该视频目录下的文件列表
   * @description CacheFile 对 IFileStorable接口的实现
   * @author tanghaixiang@xindong.com
   * @date 2019-05-21
   * @param {string} mediaHash
   * @returns {(Promise<string[] | null>)} 返回当前目录下的文件列表
   * @memberof CacheFile
   */
  async readDirBy(mediaHash: string): Promise<string[] | null> {
    let path = '';
    try {
      path = join(`${getDefaultDataPath()}/${VIDEO_DIRNAME}/`, mediaHash);
      const isExist = await checkPathExist(path);
      if (isExist) {
        return await readDir(path);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        await mkdir(path);
      }
    }
    return []
  }

  /** 公开API 根据mediaHash删除改视频相关目录
   * @description CacheFile 对 IFileStorable接口的实现
   * @author tanghaixiang@xindong.com
   * @date 2019-05-21
   * @param {string} mediaHash
   * @returns {Promise<boolean>} 是否删除成功
   * @memberof CacheFile
   */
  async removeDirBy(mediaHash: string): Promise<boolean> {
    try {
      const path = join(`${getDefaultDataPath()}/${VIDEO_DIRNAME}/`, mediaHash);
      await deleteDir(path);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const cacheFile = new CacheFile()