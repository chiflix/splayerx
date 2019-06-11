export interface IMediaStorable {
  /**
   * @description 根据hash、tag，生成对应的图片将要存放的路径
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} mediaHash
   * @param {string} tag
   * @returns {(Promise<string | null>)} 返回生成对应的路径
   * @memberof IMediaStorable
   */
  generatePathBy(mediaHash: string, tag: string): Promise<string | null>
  /**
   * @description  根据hash、tag，取得对应的图片路径
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} mediaHash
   * @param {string} tag
   * @returns {(Promise<string | null>)} 返回文件路径，如果没有就是null
   * @memberof IMediaStorable
   */
  getImageBy(mediaHash: string, tag: string): Promise<string | null>
}
