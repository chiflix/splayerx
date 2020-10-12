export interface IThumbnailRequest {
  /**
   * @description 根据当前时间信息和缩略图总数获取缩略图的backgroundPosition
   * @author tanghaixiang
   * @param {number} currentTime
   * @param {number} interval
   * @returns {number[]} 当前hover缩略图的列号(col)，行号(row)
   */
  calculateThumbnailPosition(
    currentTime: number, interval: number, cols: number,
  ): number[],
}
