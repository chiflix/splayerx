/** 退出播放前需要存储的播放进度数据格式 */
export type BeforeQuitMediaItemSaveData = {
  shortCut: string,
  smallShortCut: string,
  lastPlayedTime: number,
  duration: number,
  audioTrackId: number,
}
/** 退出播放前需要存储的播放列表数据格式 */
export type BeforeQuitRecentPlayedSaveData = {
  items: IDBValidKey[],
  lastOpened: number,
  playedIndex: number,
}

export interface IPlayInfoStorable {
  /**
   * @description 更新video播放的信息
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} videoID
   * @param {BeforeQuitMediaItemSaveData} data
   * @returns {Promise<boolean>} 返回是否成功更新
   * @memberof IPlayInfoStorable
   */
  updateMediaItemBy(videoID: string, data: BeforeQuitMediaItemSaveData): Promise<boolean>
  /**
   * @description 更新最近播放列表
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} playListID
   * @param {BeforeQuitRecentPlayedSaveData} items
   * @returns {Promise<boolean>} 返回是否成功更新
   * @memberof IPlayInfoStorable
   */
  updateRecentPlayedBy(playListID: string, items: BeforeQuitRecentPlayedSaveData): Promise<boolean>
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