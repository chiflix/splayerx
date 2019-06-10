import { ISettingStorable, SubtitleStyle, PlaybackStates } from "@/interfaces/ISettingStorable";
import JStorage, { jStorage } from "@/libs/JStorage";


const SUBTITLE_STYLE_STORAGE_NAME = 'subtitle-style';
const PLAYBACK_STATES_STORAGE_NAME = 'playback-states';

export default class SettingStorageService implements ISettingStorable {
  constructor(private readonly storage: JStorage) {
  }

  async updateSubtitleStyle(data: SubtitleStyle): Promise<boolean> {
    try {
      await this.storage.set(SUBTITLE_STYLE_STORAGE_NAME, data);
      return true;
    } catch (error) {
      return false
    }
  }
  async updatePlaybackStates(data: PlaybackStates): Promise<boolean> {
    try {
      await this.storage.set(PLAYBACK_STATES_STORAGE_NAME, data);
      return true;
    } catch (error) {
      return false
    }
  }
}


export const settingStorageService = new SettingStorageService(jStorage)