export type RecentPlayInfo = {
  src: string,
  mediaHash: string,
  cover: string, // cover path
  duration: number,
  progress?: number,
  shortCut?: string, // base64 string
}
export interface IRecentPlayRequest {
  
  /**
   * @param  {string} videoSrc
   * @returns Promise 返回视频流信息
   */
  getMediaInfo(videoSrc: string): Promise<object>
  /**
   * @param  {string} mediaHash
   * @returns Promise 返回视频封面图片
   */
  getCover(mediaHash: string): Promise<string | null>

  /**
   * @param  {string} mediaHash
   * @param  {string} videoSrc
   * @param  {number} width
   * @param  {number} height
   * @param  {number} duration
   * @returns Promise 图片地址
   */
  generateCover(mediaHash: string, videoSrc: string, width: number, height: number, duration: number): Promise<string>

  /**
   * @param  {number} videoId
   * @returns Promise 获取播放记录
   */
  getRecord(videoId: number): Promise<object | null>
  
  /**
   * @param  {string[]} playlist
   * @returns Promise 生成播放列表封面
   */
  generatePlaylistCovers(playlist: string[]): Promise<RecentPlayInfo[]>

  setPlaylist(playlsitId: number, paths: string[]): Promise<void>
}
