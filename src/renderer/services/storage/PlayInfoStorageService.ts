import { IPlayInfoStorable, BeforeQuitMediaItemSaveData, BeforeQuitRecentPlayedSaveData } from "@/interfaces/IPlayInfoStorable";
import { info, data } from "@/libs/DataBase";
import { MediaItem, PlaylistItem } from "@/interfaces/IDB";
import { VIDEO_OBJECT_STORE_NAME, RECENT_OBJECT_STORE_NAME } from "@/constants";

export default class PlayInfoStorageService implements IPlayInfoStorable {
  /**
   * @description 更新video播放的信息
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} videoID
   * @param {BeforeQuitMediaItemSaveData} data
   * @returns {Promise<boolean>} 返回布尔值, 是否成功更新
   * @memberof PlayInfoStorageService
   */
  async updateMediaItemBy(videoID: string, data: BeforeQuitMediaItemSaveData): Promise<boolean> {
    let value = null;
    try {
      value = await info.getValueByKey(VIDEO_OBJECT_STORE_NAME, Number(videoID))
    } catch (error) {
      return false;
    }
    if (value) {
      try {
        await info.update(VIDEO_OBJECT_STORE_NAME, Number(videoID), { ...value, ...data } as MediaItem);
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }
  /**
   * @description 更新最近播放列表
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} playListID
   * @param {BeforeQuitRecentPlayedSaveData} data
   * @returns {Promise<boolean>} 返回布尔值, 是否成功更新
   * @memberof PlayInfoStorageService
   */
  async updateRecentPlayedBy(playListID: string, data: BeforeQuitRecentPlayedSaveData): Promise<boolean> {
    try {
      let playList = await info.getValueByKey(RECENT_OBJECT_STORE_NAME, Number(playListID))
      await info.update(RECENT_OBJECT_STORE_NAME, Number(playList.id), { ...playList, ...data } as PlaylistItem);
      return true;
    } catch (error) {
      return false;
    }

  }

  /**
   * @description 删除播放列表
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} playListID
   * @returns {Promise<boolean>} 返回布尔值, 是否成功更新
   * @memberof PlayInfoStorageService
   */
  async deleteRecentPlayedBy(playListID: string): Promise<boolean> {
    try {
      await info.delete(RECENT_OBJECT_STORE_NAME, Number(playListID));
      return true;
    } catch (error) {
      return false;
    }
  }
}


export const playInfoStorageService = new PlayInfoStorageService()