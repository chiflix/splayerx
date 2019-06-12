import { MediaItem, PlaylistItem } from "./IDB";

export interface IPlayInfoStorable {
  /**
   * @description 更新video播放的信息
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} videoID
   * @param {MediaItem} data
   * @returns {Promise<boolean>} 返回是否成功更新
   * @memberof IPlayInfoStorable
   */
  updateMediaItemBy(videoID: string, data: MediaItem): Promise<boolean>
  /**
   * @description 更新最近播放列表
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} playListID
   * @param {PlaylistItem} items
   * @returns {Promise<boolean>} 返回是否成功更新
   * @memberof IPlayInfoStorable
   */
  updateRecentPlayedBy(playListID: string, items: PlaylistItem): Promise<boolean>
  /**
   * @description 删除播放列表
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} playListID
   * @returns {Promise<boolean>} 返回是否成果删除
   * @memberof IPlayInfoStorable
   */
  deleteRecentPlayedBy(playListID: string): Promise<boolean>
}