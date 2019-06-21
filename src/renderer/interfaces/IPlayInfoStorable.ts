import { MediaItem, PlaylistItem } from "./IDB";

export interface IPlayInfoStorable {
  /**
   * @description 更新video播放的信息
   * @author tanghaixiang
   * @param {number} videoID 视频在数据库存的ID
   * @param {MediaItem} data 视频播放信息
   * @returns {Promise<boolean>} 返回是否成功更新
   */
  updateMediaItemBy(videoID: number, data: MediaItem): Promise<boolean>
  /**
   * @description 更新最近播放列表
   * @author tanghaixiang
   * @param {number} playListID 播放列表ID
   * @param {PlaylistItem} items 播放列表元素
   * @returns {Promise<boolean>} 返回是否成功更新
   */
  updateRecentPlayedBy(playListID: number, items: PlaylistItem): Promise<boolean>
  /**
   * @description 删除播放列表
   * @author tanghaixiang
   * @param {number} playListID 播放列表ID
   * @returns {Promise<boolean>} 返回是否成果删除
   */
  deleteRecentPlayedBy(playListID: number): Promise<boolean>
  /**
   * @returns {Promise<PlaylistItem>}
   * 返回所有播放记录，按上次打开时间排序
   */
  getAllRecentPlayed(): Promise<PlaylistItem[]>
}