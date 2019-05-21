import { IMediaStorable } from '@/services/media/index';
import cacheFileInstance, { CacheFile } from '@/libs/file';
import { ELECTRON_CACHE_DIRNAME, DEFAULT_DIRNAME, VIDEO_DIRNAME } from '@/constants';
//@ts-ignore
import path, { join } from 'path';
//@ts-ignore
import electron from 'electron';

const app = electron.app || electron.remote.app;

// 视频元数据
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

export class MediaStorageService implements IMediaStorable {
  constructor(private readonly cacheFile: CacheFile) {
  }

  getCover(hash: string): Promise<string | null> {
    throw new Error("Method not implemented.");
  }

  /** 私有方法 创建目录
   * @description MediaStorageService 内部方法
   * @author tanghaixiang@xindong.com
   * @date 2019-05-21
   * @private
   * @param {string} mediaHash
   * @returns {Promise<string>}
   * @memberof MediaStorageService
   */
  private createDir(mediaHash: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const p = join(`${getDefaultDataPath()}/${VIDEO_DIRNAME}/`, mediaHash);
      try {
        await this.cacheFile.createDir(p);
        resolve(p);
      } catch (error) {
        reject(error);
      }
    });
  }

  /** 私有方法 获取路径下的视频元数据
   * @description MediaStorageService 内部方法
   * @author tanghaixiang@xindong.com
   * @date 2019-05-21
   * @private
   * @param {string} mediaHash
   * @returns {(Promise<VideoInfo | null>)}
   * @memberof MediaStorageService
   */
  private readVideoInfo(mediaHash: string): Promise<VideoInfo | null> {
    return new Promise(async (resolve, reject) => {
      const p = join(`${getDefaultDataPath()}/${VIDEO_DIRNAME}/`, mediaHash);
      try {
        const result: VideoInfo = {};
        const list = await this.cacheFile.readDir(p);
        if (list && list.length) {
          list.forEach((e) => {
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
        resolve(result)
      } catch (error) {
        reject(error);
      }
    });
  }

  /** 公开API 根据hash、tag，取得对应的图片路径
   * @description MediaStorageService 对 IMediaStorable接口的实现
   * @author tanghaixiang@xindong.com
   * @date 2019-05-21
   * @param {string} mediaHash
   * @param {string} tag
   * @returns {(Promise<string | null>)}
   * @memberof MediaStorageService
   */
  async getImage(mediaHash: string, tag: string): Promise<string | null> {
    try {
      const r = await this.readVideoInfo(mediaHash);
      return r && r[tag] ? r[tag] : null;
    } catch (err) {
      return null
    }
  }
  
  /** 公开API 根据hash、tag，生成对应的图片将要存放的路径
   * @description MediaStorageService 对 IMediaStorable接口的实现
   * @author tanghaixiang@xindong.com
   * @date 2019-05-21
   * @param {string} mediaHash
   * @param {string} tag
   * @returns {(Promise<string | null>)}
   * @memberof MediaStorageService
   */
  async generate(mediaHash: string, tag: string): Promise<string | null> {
    try {
      const p = await this.createDir(mediaHash);
      return join(p, `${tag}.jpg`);
    } catch (err) {
      return null
    }
  }
}

export default new MediaStorageService(cacheFileInstance);