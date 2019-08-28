export interface IThumbnailRequest {
  // /**
  //  * @description 根据视频的hash获取对于的缩略图路径
  //  * @author tanghaixiang
  //  * @param {string} mediaHash
  //  * @returns {(Promise<string | null>)} 返回对应视频的缩略图路径
  //  */
  // getThumbnailImage(mediaHash: string): Promise<string | null>
  // /**
  //  * @description 根据该视频创建缩略图对应的路径，
  //  * @author tanghaixiang
  //  * @param {string} mediaHash
  //  * @param {string} videoSrc
  //  * @param {number} cols
  //  * @param {number} width
  //  * @returns {Promise<string>} 返回生成的缩略图路径
  //  */
  // generateThumbnailImage(
  //   mediaHash: string,
  //   videoSrc: string,
  //   cols: number,
  //   width: number,
  // ): Promise<string>
  /**
   * @description 根据当前时间信息和缩略图总数获取缩略图的backgroundPosition
   * @author tanghaixiang
   * @param {number} currentTime
   * @param {number} interval
   * @returns {number[]} 当前hover缩略图的backgroundPosition
   */
  calculateThumbnailPosition(
    currentTime: number, interval: number, cols: number,
  ): number[]
}
