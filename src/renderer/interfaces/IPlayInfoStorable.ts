import { MediaItem, PlaylistItem } from './IDB';

export interface IPlayInfoStorable {
  /**
   * @description 更新video播放的信息
   * @author tanghaixiang
   * @param {number} videoID 视频在数据库存的ID
   * @param {MediaItem} data 视频播放信息
   * @returns {Promise<MediaItem | boolean>} 返回是否成功更新
   */
  updateMediaItemBy(videoID: number, data: MediaItem): Promise<MediaItem | boolean>,
  /**
   * @description 更新最近播放列表
   * @author tanghaixiang
   * @param {number} playlistId 播放列表ID
   * @param {PlaylistItem} items 播放列表元素
   * @returns {Promise<boolean>} 返回是否成功更新
   */
  updateRecentPlayedBy(playlistId: number, items: PlaylistItem): Promise<boolean>,
  /**
   * @description 删除播放列表
   * @author tanghaixiang
   * @param {number} playlistId 播放列表ID
   * @returns {Promise<boolean>} 返回是否成果删除
   */
  deleteRecentPlayedBy(playlistId: number): Promise<boolean>,
  /**
   * @returns {Promise<PlaylistItem>}
   * 返回所有播放记录，按上次打开时间排序
   */
  getAllRecentPlayed(): Promise<PlaylistItem[]>,
  /**
   * @param  {number} playlistId 播放列表ID
   * @returns {Promise<PlaylistItem>}
   * 返回指定ID的播放列表记录
   */
  getPlaylistRecord(playlistId: number): Promise<PlaylistItem>,
  /**
   * @param  {number} mediaitemId 视频ID
   * @returns {Promise<MediaItem>}
   * 返回指定ID的视频记录
   */
  getMediaItem(mediaitemId: number): Promise<MediaItem>,
}
