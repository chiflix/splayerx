import { MediaItem } from '@/interfaces/IDB';

export interface IPlaylistRequest {
  coverSrc: string;
  duration: any;
  record: MediaItem;
  smallShortCut: string;
  lastPlayedTime: number;
  imageSrc: string | undefined;

  /**
   * @param  {string} mediaHash
   * @returns Promise 返回视频封面地址
   */
  getCover(mediaHash: string): Promise<string | null>
  /**
   * @param  {number} videoId optional
   * @returns Promise 获取播放记录
   */
  getRecord(videoId?: number): Promise<void>
}
