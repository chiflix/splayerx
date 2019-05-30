import { IRecentPlayRequest, RecentPlayInfo } from '@/interfaces/containers/IRecentPlayRequest';
import MediaStorageService, { mediaStorageService } from '@/services/storage/MediaStorageService';
import Helpers from '@/helpers';
import { ipcRenderer } from 'electron';
import { mediaHash } from '@/components/Subtitle/SubtitleLoader/utils';
import { resolve } from 'path';

export type MediaInfo = {
  duration: number,
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

  setPlaylist(): void {
  }
}

export const recentPlayService = new RecentPlayService(mediaStorageService);