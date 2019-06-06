import { IRecentPlayRequest, RecentPlayInfo } from '@/interfaces/containers/IRecentPlayRequest';
import MediaStorageService, { mediaStorageService } from '@/services/storage/MediaStorageService';
import Helpers from '@/helpers';
import { ipcRenderer } from 'electron';
import store from '@/store/index';
import { database } from '@/libs/DataBase'
import { INFO_DATABASE_NAME } from '@/constants';
import { PlaylistItem } from '@/interfaces/services/IDB';

export type MediaInfo = {
  duration: number,
}

function getOriginSrc() {
  return store.getters.originSrc;
}
function getPlaylistId() {
  return store.getters.playListId;
}

export default class RecentPlayService implements IRecentPlayRequest {
  constructor(private readonly mediaStorageService: MediaStorageService) {
  }
   /**
   * @param  {string} mediaHash
   * @returns Promise 返回视频封面图片
   */
  async getCover(mediaHash: string): Promise<string | null> {
    try {
      const result = await this.mediaStorageService.getImageBy(mediaHash, 'cover');
      return result;
    } catch(err) {
      return null; 
    }
  }
  async getMediaInfo(videoSrc: string): Promise<MediaInfo> {
    return new Promise((resolve, j) => {
      ipcRenderer.send('mediaInfo', videoSrc);
      ipcRenderer.once(`mediaInfo-${videoSrc}-reply`, async (event: any, info: string) => {
        const format: MediaInfo = JSON.parse(info).format;
        resolve(format);
      });
    });
  }
  /**
   * @param  {string} mediaHash
   * @param  {string} videoSrc
   * @param  {number} width
   * @param  {number} height
   * @param  {number} duration
   * @returns Promise 图片地址
   */
  async generateCover(mediaHash: string, videoSrc: string, width: number, height: number, duration: number): Promise<string> {
    try {
      const gpath = await this.mediaStorageService.generatePathBy(mediaHash, 'cover');
      if (gpath) {
        const info = {
          src: videoSrc,
          imgPath: gpath,
          duration,
          width,
          height,
        };
        ipcRenderer.send('snapShot', info);
        return gpath;
      }
    } catch (err) {
    }
    return '';
  }

  async generatePlaylistCovers(playlist: string[]): Promise<RecentPlayInfo[]> {
    const covers: RecentPlayInfo[] = [];
    playlist.forEach(async (src) => {
      // getMediaInfo
      // getCover
      // generateCover if no result
      const mediaHash: string = await Helpers.methods.mediaQuickHash(src);
      const mediaInfo = await this.getMediaInfo(src);
      const duration = mediaInfo.duration;
      const result: string | null = await this.getCover(mediaHash);
      let cover: string;
      if (!result) {
        cover = await this.generateCover(mediaHash, src, 0, 0, mediaInfo.duration);
      } else {
        cover = result;
      }
      const info: RecentPlayInfo = {
        src,
        mediaHash,
        cover,
        duration,
      }
      covers.push(info);
    });
    return covers;
  }
  /**
   * @param  {number} videoId
   * @returns Promise 获取播放记录
   */
  async getRecord(videoId: number): Promise<object | null> {
    return {};
  }

  async setPlaylist(): Promise<void> {
    const playListId = getPlaylistId();
    console.log(playListId);
    const result = await database.getValueByKey(INFO_DATABASE_NAME, 'recent-played', playListId);
    const playlist = result as PlaylistItem;
    const currentVideoId = playlist.items[0];
    const currentVideoHp = playlist.hpaths[0];
    const items = [];
    const hpaths = [];
    /* eslint-disable */
    for (const videoPath of this.playingList) {
      if (videoPath !== getOriginSrc()) {
        const quickHash = await this.mediaQuickHash(videoPath);
        const data = {
          quickHash,
          type: 'video',
          path: videoPath,
          source: 'playlist',
        };
        const videoId = await this.infoDB.add('media-item', data);
        items.push(videoId);
        hpaths.push(`${quickHash}-${videoPath}`);
      } else {
        items.push(currentVideoId);
        hpaths.push(currentVideoHp);
      }
    }
    playlist.items = items;
    playlist.hpaths = hpaths;
    this.infoDB.update('recent-played', playlist, playlist.id);
    this.store.dispatch('PlayingList', { id: playlist.id, paths: this.playingList, items: playlist.items });
  }
}

export const recentPlayService = new RecentPlayService(mediaStorageService);