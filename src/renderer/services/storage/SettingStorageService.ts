import { ISettingStorable, SubtitleStyle, PlaybackStates } from '@/interfaces/ISettingStorable';
import JsonStorage, { jsonStorage } from '@/libs/JsonStorage';

/** 字幕设置存储的KEY
 * @constant
 * @type string
 */
const SUBTITLE_STYLE_STORAGE_NAME = 'subtitle-style';
/** 播放设置存储的KEY
 * @constant
 * @type string
 */
const PLAYBACK_STATES_STORAGE_NAME = 'playback-states';

export default class SettingStorageService implements ISettingStorable {
  constructor(private readonly storage: JsonStorage) {
  }

  /**
   * @description 更新字幕样式设置
   * @author tanghaixiang
   * @param {SubtitleStyle} data
   * @returns {Promise<boolean>} 返回布尔值，是否成功更新
   */
  async updateSubtitleStyle(data: SubtitleStyle): Promise<boolean> {
    try {
      await this.storage.set(SUBTITLE_STYLE_STORAGE_NAME, data);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * @description 更新播放设置
   * @author tanghaixiang
   * @param {PlaybackStates} data
   * @returns {Promise<boolean>} 返回布尔值，是否成功更新
   */
  async updatePlaybackStates(data: PlaybackStates): Promise<boolean> {
    try {
      await this.storage.set(PLAYBACK_STATES_STORAGE_NAME, data);
      return true;
    } catch (error) {
      return false;
    }
  }
}


export const settingStorageService = new SettingStorageService(jsonStorage);
