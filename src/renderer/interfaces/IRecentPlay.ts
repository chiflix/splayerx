export type LandingViewDisplayInfo = {
  id: number, // playlist id
  basename: string,
  lastPlayedTime: number,
  duration: number,
  percentage: number,
  path: string,
  backgroundUrl: string,
  playedIndex?: number, // playedIndex playlist only
  playlistLength?: number, // playlist only
};
export default interface IRecentPlay {
  /**
   * @returns Promise
   * 获取LandingView所需数据
   */
  getRecords(): Promise<LandingViewDisplayInfo[]>
}