import { IThumbnailRequest } from '@/interfaces/IThumbnailRequest';

export default class ThumbnailService implements IThumbnailRequest {
  /** 根据当前时间信息和缩略图总数获取缩略图的backgroundPosition
   * @description ThumbnailService 对 ThumbnailRequest接口的实现
   * @author TanYang
   * @date 2019-05-22
   * @param {number} currentTime
   * @param {number} interval
   * @returns {string} 当前hover缩略图的列号(col)，行号(row)
   */
  public calculateThumbnailPosition(
    currentTime: number,
    interval: number,
    cols: number,
  ): number[] {
    const currentIndex = Math.ceil(currentTime / interval);
    const row = Math.floor(currentIndex / cols);
    const col = currentIndex - (cols * row);
    return [col, row];
  }
}

export const thumbnailService = new ThumbnailService();
