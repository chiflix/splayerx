/** 设置中字幕样式的数据格式 */
export type SubtitleStyle = {
  chosenStyle: string,
  chosenSize: string,
  enabledSecondarySub: boolean
}
/** 设置中播放首选项的数据格式 */
export type PlaybackStates = {
  volume: number,
  muted: boolean
}

export interface ISettingStorable {
  /**
   * @description 更新字幕样式设置
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {SubtitleStyle} data
   * @returns {Promise<boolean>} 返回是否成果更新
   * @memberof ISettingStorable
   */
  updateSubtitleStyle(data: SubtitleStyle): Promise<boolean>
  /**
   * @description 更新播放设置
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {PlaybackStates} data
   * @returns {Promise<boolean>} 返回是否成果更新
   * @memberof ISettingStorable
   */
  updatePlaybackStates(data: PlaybackStates): Promise<boolean>
}