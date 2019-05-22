import { IThumbnailRequest } from '@/containers/ThumbnailRequest';
import mediaStorageService, { MediaStorageService } from '@/services/storage/mediaStorageService';
import { ipcRenderer } from 'electron';

export class ThumbnailService implements IThumbnailRequest {
  constructor(private readonly mediaStorageService: MediaStorageService) {
  }

  /** 公开API 根据该视频创建缩略图对应的路径，
   * @description ThumbnailService 对 ThumbnailRequest接口的实现
   * @author tanghaixiang@xindong.com
   * @date 2019-05-21
   * @param {string} mediaHash
   * @param {string} videoSrc
   * @param {number} cols
   * @returns {Promise<string>} 返回生成的缩略图路径
   * @memberof ThumbnailService
   */
  async generateImage(mediaHash: string, videoSrc: string, cols: number): Promise<string> {
    try {
      const gpath = await this.mediaStorageService.generatePathBy(mediaHash, 'thumbnail');
      if (gpath) {
        const info = {
          src: videoSrc,
          outPath: gpath,
          width: '272',
          num: { rows: '10', cols: `${Math.ceil(cols / 10)}` },
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
   * @author tanghaixiang@xindong.com
   * @date 2019-05-21
   * @param {string} mediaHash
   * @returns {(Promise<string | null>)} 返回对应视频的缩略图路径
   * @memberof ThumbnailService
   */
  async getImage(mediaHash: string): Promise<string | null> {
    try {
      const result = await this.mediaStorageService.getImageBy(mediaHash, 'thumbnail');
      return result
    } catch (err) {
      return null
    }
  }
}

export default new ThumbnailService(mediaStorageService)
