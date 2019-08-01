import { IPlayInfoStorable } from '@/interfaces/IPlayInfoStorable';
import { info } from '@/libs/DataBase';
import { MediaItem, PlaylistItem } from '@/interfaces/IDB';
import { VIDEO_OBJECT_STORE_NAME, RECENT_OBJECT_STORE_NAME } from '@/constants';

export default class PlayInfoStorageService implements IPlayInfoStorable {
  /**
   * @description 更新video播放的信息
   * @author tanghaixiang
   * @param {number} videoID
   * @param {MediaItem} data
   * @returns {Promise<boolean>} 返回布尔值, 是否成功更新
   */
  public async updateMediaItemBy(
    videoID: number,
    data: MediaItem,
  ): Promise<boolean> {
    let value = null;
    try {
      value = await info.getValueByKey(VIDEO_OBJECT_STORE_NAME, videoID);
    } catch (error) {
      return false;
    }
    if (value) {
      try {
        const updateData: MediaItem = { ...value, ...data };
        await info.update(VIDEO_OBJECT_STORE_NAME, videoID, updateData);
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  /**
   * @description 更新最近播放列表
   * @author tanghaixiang
   * @param {number} playlistId
   * @param {PlaylistItem} data
   * @returns {Promise<boolean>} 返回布尔值, 是否成功更新
   */
  public async updateRecentPlayedBy(
    playlistId: number,
    data: PlaylistItem,
  ): Promise<boolean> {
    try {
      const playList = await info.getValueByKey(RECENT_OBJECT_STORE_NAME, playlistId);
      const updateData: PlaylistItem = { ...playList, ...data };
      await info.update(RECENT_OBJECT_STORE_NAME, playlistId, updateData);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * @description 删除播放列表
   * @author tanghaixiang
   * @param {number} playlistId
   * @returns {Promise<boolean>} 返回布尔值, 是否成功更新
   */
  public async deleteRecentPlayedBy(playlistId: number): Promise<boolean> {
    try {
      const { items } = await info.getValueByKey(RECENT_OBJECT_STORE_NAME, playlistId);
      await Promise.all(items.map(async (item: number) => {
        try {
          await info.delete(VIDEO_OBJECT_STORE_NAME, item);
        } catch (err) {
          // empty
        }
      }));
      await info.delete(RECENT_OBJECT_STORE_NAME, playlistId);
      return true;
    } catch (error) {
      return false;
    }
  }

  public async getAllRecentPlayed(): Promise<PlaylistItem[]> {
    const results: PlaylistItem[] = (await info.getAll('recent-played'))
      .sort((a: PlaylistItem, b: PlaylistItem) => b.lastOpened - a.lastOpened);
    results.forEach((record, index) => {
      if (index >= 10) {
        info.delete(RECENT_OBJECT_STORE_NAME, record.id);
      }
    });
    return results.splice(0, 9);
  }

  public async getPlaylistRecord(playlistId: number): Promise<PlaylistItem> {
    return info.getValueByKey(RECENT_OBJECT_STORE_NAME, playlistId);
  }

  public async getMediaItem(mediaitemId: number): Promise<MediaItem> {
    return info.getValueByKey(VIDEO_OBJECT_STORE_NAME, mediaitemId);
  }
}


export const playInfoStorageService = new PlayInfoStorageService();
