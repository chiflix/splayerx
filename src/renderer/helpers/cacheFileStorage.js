/*
 * @Author: tanghaixiang@xindong.com
 * @Date: 2019-02-22 11:37:18
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-03-01 13:25:19
 */

/** file dir list
 *  .
 *  ├── cover.jpg
 *  ├── shortCut.jpg
 *  ├── subtitles
 *  │    └── modified
 *  │         └── xx 1.vtt
 *  └── thumbnail.jpg
 */

import { access, readdir } from 'fs';
import path, { join } from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import electron from 'electron';

const app = electron.app || electron.remote.app;

const ELECTRON_CACHE_DIRNAME = 'userData'; // 用户数据路径
const DEFAULT_DIRNAME = 'temp'; // 设定的应用缓存目录
const VIDEO_DIRNAME = 'videos'; // 视频缓存目录

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
function mkdir(p) {
  return new Promise((resolve, reject) => {
    mkdirp(p, (err) => {
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
function checkPermission(p) {
  return new Promise((resolve, reject) => {
    access(p, async (err) => {
      if (err) {
        const result = await mkdir(p);
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(true);
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
 * @param {*} p
 * @returns Promise
 */
function readDirDeep(p) {
  const result = {};
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
 * @description 通过mediaHash去获取视频的元数据，封面图、缩略图...
 * @author tanghaixiang@xindong.com
 * @date 2019-03-01
 * @export
 * @param {String} key 视频的mediaHash
 * @returns {Promise} resolve { cover: '/.../cover.jpg', ...} or reject Error
 */
export function getVideoInfoByMediaHash(key) {
  if (Object.prototype.toString.call(key).toLowerCase() !== '[object string]') throw new Error('key should be String');
  const p = join(`${getDefaultDataPath()}/${VIDEO_DIRNAME}/`, key);
  return new Promise(async (resolve, reject) => {
    const cp = await checkPermission(p);
    if (cp instanceof Error) {
      reject(cp);
    } else {
      const result = await readDirDeep(p);
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve(result);
      }
    }
  });
}

/**
 * @description 通过视频的mediaHash获取该视频的thumbnail路径
 * @author tanghaixiang@xindong.com
 * @date 2019-03-01
 * @export
 * @param {String} key 视频的mediaHash
 * @returns {Promise} resolve '/.../thumbnail.jpg' or reject Error
 */
export async function generateThumbnailPathByMediaHash(key) {
  if (Object.prototype.toString.call(key).toLowerCase() !== '[object string]') throw new Error('key should be String');
  const p = join(`${getDefaultDataPath()}/${VIDEO_DIRNAME}/`, key);
  const cp = await checkPermission(p);
  if (cp instanceof Error) {
    return cp;
  }
  return join(p, 'thumbnail.jpg');
}

/**
 * @description 通过视频的mediaHash获取该视频的cover路径
 * @author tanghaixiang@xindong.com
 * @date 2019-03-01
 * @export
 * @param {String} key 视频的mediaHash
 * @returns {Promise} resolve '/.../cover.jpg' or reject Error
 */
export async function generateCoverPathByMediaHash(key) {
  if (Object.prototype.toString.call(key).toLowerCase() !== '[object string]') throw new Error('key should be String');
  const p = join(`${getDefaultDataPath()}/${VIDEO_DIRNAME}/`, key);
  const cp = await checkPermission(p);
  if (cp instanceof Error) {
    return cp;
  }
  return join(p, 'cover.jpg');
}

/**
 * @description 通过视频的mediaHash获取该视频的shortCut路径
 * @author tanghaixiang@xindong.com
 * @date 2019-03-01
 * @export
 * @param {String} key 视频的mediaHash
 * @returns {Promise} resolve '/.../shortCut.jpg' or reject Error
 */
export async function generateShortCutPathByMediaHash(key) {
  if (Object.prototype.toString.call(key).toLowerCase() !== '[object string]') throw new Error('key should be String');
  const p = join(`${getDefaultDataPath()}/${VIDEO_DIRNAME}/`, key);
  const cp = await checkPermission(p);
  if (cp instanceof Error) {
    return cp;
  }
  return join(p, 'shortCut.jpg');
}

/**
 * @description 通过视频的mediaHash删除该视频目录
 * @author tanghaixiang@xindong.com
 * @date 2019-03-01
 * @export
 * @param {String} key 视频的mediaHash
 * @returns {Promise} resolve true or reject Error
 */
export async function deleteDirByMediaHash(key) {
  const p = join(`${getDefaultDataPath()}/${VIDEO_DIRNAME}/`, key);
  return new Promise((resolve, reject) => {
    rimraf(p, (err) => {
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
export async function clearAll() {
  return new Promise((resolve, reject) => {
    rimraf(getDefaultDataPath(), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

export default {
  getVideoInfoByMediaHash,
  generateThumbnailPathByMediaHash,
  generateCoverPathByMediaHash,
  generateShortCutPathByMediaHash,
  deleteDirByMediaHash,
  clearAll,
};
