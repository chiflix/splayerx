import { MediaItem, PlaylistItem } from "./IDB";

export interface IPlayInfoStorable {
  /**
   * @description 更新video播放的信息
   * @author tanghaixiang
   * @param {string} videoID 视频在数据库存的ID
   * @param {MediaItem} data 视频播放信息
   * @returns {Promise<boolean>} 返回是否成功更新
   */
  updateMediaItemBy(videoID: string, data: MediaItem): Promise<boolean>
  /**
   * @description 更新最近播放列表
   * @author tanghaixiang
   * @param {string} playListID 播放列表ID
   * @param {PlaylistItem} items 播放列表元素
   * @returns {Promise<boolean>} 返回是否成功更新
   */
  updateRecentPlayedBy(playListID: string, items: PlaylistItem): Promise<boolean>
  /**
   * @description 删除播放列表
   * @author tanghaixiang
   * @param {string} playListID 播放列表ID
   * @returns {Promise<boolean>} 返回是否成果删除
   */
  deleteRecentPlayedBy(playListID: string): Promise<boolean>
}