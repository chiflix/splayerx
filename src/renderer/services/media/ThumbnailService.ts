import { IThumbnailRequest } from '@/interfaces/IThumbnailRequest';
import MediaStorageService, { mediaStorageService } from '@/services/storage/MediaStorageService';
import { ipcRenderer } from 'electron';

/** 缩略图固定的列数
 * @constant
 * @type number
 */
const COLS = 10;

export default class ThumbnailService implements IThumbnailRequest {
  constructor(private readonly mediaStorageService: MediaStorageService) {
  }

  /** 公开API 根据该视频创建缩略图对应的路径，
   * @description ThumbnailService 对 ThumbnailRequest接口的实现
   * @author tanghaixiang
   * @param {string} mediaHash
   * @param {string} videoSrc
   * @param {number} cols
   * @returns {Promise<string>} 返回生成的缩略图路径
   */
  async generateThumbnailImage(mediaHash: string, videoSrc: string, cols: number, width: number): Promise<string> {
    try {
      const gpath = await this.mediaStorageService.generatePathBy(mediaHash, 'thumbnail');
      if (gpath) {
        const info = {
          src: videoSrc,
          outPath: gpath,
          width: `${width}`,
          num: { rows: `${Math.ceil(cols / COLS)}`, cols: `${COLS}` },
        };
        ipcRenderer.send('generateThumbnails', info);
        return gpath;
      }
    } catch (err) {
    }
    return '';
  }

  /** 公开API 根据视频的hash获取对于的缩略图路径
   * @description ThumbnailService 对 ThumbnailRequest接口的实现
   * @author tanghaixiang
   * @param {string} mediaHash
   * @returns {(Promise<string | null>)} 返回对应视频的缩略图路径
   */
  async getThumbnailImage(mediaHash: string): Promise<string | null> {
    try {
      const result = await this.mediaStorageService.getImageBy(mediaHash, 'thumbnail');
      return result
    } catch (err) {
      return null
    }
  }

  /** 根据当前时间信息和缩略图总数获取缩略图的backgroundPosition
   * @description ThumbnailService 对 ThumbnailRequest接口的实现
   * @author TanYang
   * @date 2019-05-22
   * @param {number} currentTime
   * @param {number} duration
   * @param {number} count
   * @returns {string} 当前hover缩略图的backgroundPosition
   */
  calculateThumbnailPosition(currentTime: number, duration: number, count: number): number[] {
    const currentIndex = Math.abs(Math.floor(currentTime / (duration / count)));
    const column = currentIndex === 0 ? 0 : Math.ceil(currentIndex / COLS) - 1;
    const row = currentIndex - (COLS * column);
    return [row * 100, column * 100];
  }
}

export const thumbnailService = new ThumbnailService(mediaStorageService);

