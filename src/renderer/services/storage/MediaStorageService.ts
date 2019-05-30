import { IMediaStorable } from '@/interfaces/services/IMediaStorable';
import CacheFile, { cacheFile as cacheFileInstance } from '@/libs/CacheFile'
import { join } from 'path';

// 视频元数据
export type VideoInfo = {
  cover?: string,
  shortCut?: string,
  thumbnail?: string
}

export default class MediaStorageService implements IMediaStorable {
  constructor(private readonly cacheFile: CacheFile) {
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
      try {
        const path = this.cacheFile.getPathBy(mediaHash);
        const result: VideoInfo = {};
        const list = await this.cacheFile.readDirBy(mediaHash);
        if (list && list.length) {
          list.forEach((e) => {
            const name = e.toLocaleLowerCase();
            if (name.includes('cover')) {
              result.cover = join(path, e);
            }
            if (name.includes('shortcut')) {
              result.shortCut = join(path, e);
            }
            if (name.includes('thumbnail')) {
              result.thumbnail = join(path, e);
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
   * @returns {(Promise<string | null>)} 返回文件路径，如果没有就是null
   * @memberof MediaStorageService
   */
  async getImageBy(mediaHash: string, tag: string): Promise<string | null> {
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
   * @returns {(Promise<string | null>)} 返回生成对应的路径
   * @memberof MediaStorageService
   */
  async generatePathBy(mediaHash: string, tag: string): Promise<string | null> {
    try {
      const path = await this.cacheFile.getPathBy(mediaHash);
      return join(path, `${tag}.jpg`);
    } catch (err) {
      return null
    }
  }
}

export const mediaStorageService = new MediaStorageService(cacheFileInstance);
