import { ipcRenderer } from 'electron';
import { IThumbnailRequest } from '@/interfaces/IThumbnailRequest';
import MediaStorageService, { mediaStorageService } from '@/services/storage/MediaStorageService';

export default class ThumbnailService implements IThumbnailRequest {
  private mediaStorageService: MediaStorageService;

  public constructor(mediaStorageService: MediaStorageService) {
    this.mediaStorageService = mediaStorageService;
  }

  // /** 公开API 根据该视频创建缩略图对应的路径，
  //  * @description ThumbnailService 对 ThumbnailRequest接口的实现
  //  * @author tanghaixiang
  //  * @param {string} mediaHash
  //  * @param {string} videoSrc
  //  * @param {number} cols
  //  * @returns {Promise<string>} 返回生成的缩略图路径
  //  */
  // public async generateThumbnailImage(
  //   mediaHash: string,
  //   videoSrc: string,
  //   cols: number,
  //   width: number,
  // ): Promise<string> {
  //   try {
  //     const gpath = await this.mediaStorageService.generatePathBy(mediaHash, 'thumbnail');
  //     if (gpath) {
  //       const info = {
  //         src: videoSrc,
  //         outPath: gpath,
  //         width: `${width}`,
  //         num: { rows: `${Math.ceil(cols / COLS)}`, cols: `${COLS}` },
  //       };
  //       ipcRenderer.send('generateThumbnails', info);
  //       return gpath;
  //     }
  //   } catch (err) {
  //     // empty
  //   }
  //   return '';
  // }

  // /** 公开API 根据视频的hash获取对于的缩略图路径
  //  * @description ThumbnailService 对 ThumbnailRequest接口的实现
  //  * @author tanghaixiang
  //  * @param {string} mediaHash
  //  * @returns {(Promise<string | null>)} 返回对应视频的缩略图路径
  //  */
  // public async getThumbnailImage(mediaHash: string): Promise<string | null> {
  //   try {
  //     const result = await this.mediaStorageService.getImageBy(mediaHash, 'thumbnail');
  //     return result;
  //   } catch (err) {
  //     return null;
  //   }
  // }

  /** 根据当前时间信息和缩略图总数获取缩略图的backgroundPosition
   * @description ThumbnailService 对 ThumbnailRequest接口的实现
   * @author TanYang
   * @date 2019-05-22
   * @param {number} currentTime
   * @param {number} interval
   * @returns {string} 当前hover缩略图的backgroundPosition
   */
  public calculateThumbnailPosition(
    currentTime: number,
    interval: number,
    cols: number,
  ): number[] {
    const currentIndex = Math.ceil(currentTime / interval);
    const row = Math.floor(currentIndex / cols);
    const col = currentIndex - (cols * row);
    return [col * 100, row * 100];
  }
}

export const thumbnailService = new ThumbnailService(mediaStorageService);
