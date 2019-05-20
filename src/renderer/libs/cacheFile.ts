import { IFileStorable } from '@/services/storage/index';
import { access, readdir } from 'fs';
//@ts-ignore
import path, { join } from 'path';
//@ts-ignore
import mkdirp from 'mkdirp';
//@ts-ignore
import rimraf from 'rimraf';
//@ts-ignore
import electron from 'electron';

const app = electron.app || electron.remote.app;

const ELECTRON_CACHE_DIRNAME = 'userData'; // 用户数据路径
const DEFAULT_DIRNAME = '__cache_files__'; // 设定的应用缓存目录
const VIDEO_DIRNAME = 'videos'; // 视频缓存目录

export type VideoInfo = {
  cover?: string,
  shortCut?: string,
  thumbnail?: string
}


/**
 * @description 获取electron应用用户目录下的设定的缓存路径
 * @author tanghaixiang@xindong.com
 * @date 2019-03-01
 * @returns String
 */
function getDefaultDataPath() {
  return path.join(app.getPath(ELECTRON_CACHE_DIRNAME), DEFAULT_DIRNAME);
}

/**
 * @description 创建目录
 * @author tanghaixiang@xindong.com
 * @date 2019-03-01
 * @param {String} p path
 * @returns Promise
 */
function mkdir(p: string) {
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

/**
 * @description 检查path是否可以访问，如果不存在就创建
 * @author tanghaixiang@xindong.com
 * @date 2019-03-01
 * @param {String} p path
 * @returns Promise
 */
function checkPermission(p: string) {
  return new Promise((resolve, reject) => {
    access(p, async (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          try {
            await mkdir(p);
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

/**
 * @description 读取目录下的元数据
 * @author tanghaixiang@xindong.com
 * @date 2019-03-01
 * @param {String} p
 * @returns Promise<VideoInfo>
 */
function readDirDeep(p: string) {
  const result: VideoInfo = {};
  return new Promise((resolve, reject) => {
    readdir(p, (err, files) => {
      if (err) {
        reject(err);
      } else {
        files.length && files.forEach((e) => {
          const name = e.toLocaleLowerCase();
          if (name.includes('cover')) {
            result.cover = join(p, e);
          }
          if (name.includes('shortcut')) {
            result.shortCut = join(p, e);
          }
          if (name.includes('thumbnail')) {
            result.thumbnail = join(p, e);
          }
        });
        resolve(result);
      }
    });
  });
}


/**
 * @description 通过视频的mediaHash删除该视频目录
 * @author tanghaixiang@xindong.com
 * @date 2019-03-01
 * @export
 * @param {String} key 视频的mediaHash
 * @returns {Promise} resolve true or reject Error
 */
function deleteDirByMediaHash(key: string) {
  const p = join(`${getDefaultDataPath()}/${VIDEO_DIRNAME}/`, key);
  return new Promise((resolve, reject) => {
    rimraf(p, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * @description 删除设定应用缓存目录
 * @author tanghaixiang@xindong.com
 * @date 2019-03-01
 * @export
 * @returns {Promise} resolve true or reject Error
 */
function clearAll() {
  return new Promise((resolve, reject) => {
    rimraf(getDefaultDataPath(), (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * @description Storage模块需要文件系统实现的业务
 * @author tanghaixiang@xindong.com
 * @date 2019-05-20
 * @export
 * @class CacheFile
 * @implements {IFileStorable}
 */
export class CacheFile implements IFileStorable {
  async generate(mediaHash: string, tag: string): Promise<string|null> {
    const p = join(`${getDefaultDataPath()}/${VIDEO_DIRNAME}/`, mediaHash);
    try {
      await checkPermission(p);
      return join(p, `${tag}.jpg`);
    } catch (err) {
      return null;
    }
  }
  async read(mediaHash: string): Promise<VideoInfo|null> {
    const p = join(`${getDefaultDataPath()}/${VIDEO_DIRNAME}/`, mediaHash);
    try {
      return readDirDeep(p);
    } catch (err) {
      return null;
    }
  }
  async remove(mediaHash: string): Promise<boolean> {
    try {
      await deleteDirByMediaHash(mediaHash);
      return true;
    } catch (err) {
      return false;
    }
  }
  async clear(): Promise<boolean> {
    try {
      await clearAll();
      return true;
    } catch (err) {
      return false;
    }
  }  
}

export default new CacheFile()