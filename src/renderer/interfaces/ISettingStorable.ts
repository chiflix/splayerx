/** 设置中字幕样式的数据格式 */
export type SubtitleStyle = {
  chosenStyle: string,
  chosenSize: string,
  enabledSecondarySub: boolean,
}
/** 设置中播放首选项的数据格式 */
export type PlaybackStates = {
  volume: number,
  muted: boolean,
}

export interface ISettingStorable {
  /**
   * @description 更新字幕样式设置
   * @author tanghaixiang
   * @param {SubtitleStyle} data 字幕设置数据
   * @returns {Promise<boolean>} 返回是否成果更新
   */
  updateSubtitleStyle(data: SubtitleStyle): Promise<boolean>,
  /**
   * @description 更新播放设置
   * @author tanghaixiang
   * @param {PlaybackStates} data 播放设置数据
   * @returns {Promise<boolean>} 返回是否成果更新
   */
  updatePlaybackStates(data: PlaybackStates): Promise<boolean>,
}
