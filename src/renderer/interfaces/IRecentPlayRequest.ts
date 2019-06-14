import { MediaItem } from '@/interfaces/IDB';

export interface IRecentPlayRequest {
  coverSrc: string;
  duration: any;
  record: MediaItem;
  smallShortCut: string;
  lastPlayedTime: number;
  imageSrc: string | undefined;
  imageLoaded: boolean;
  
  /**
   * @param  {string} mediaHash
   * @returns Promise 返回视频封面图片
   */
  getCover(mediaHash: string): Promise<string | null>
  /**
   * @param  {number} videoId
   * @returns Promise 获取播放记录
   */
  getRecord(videoId?: number): Promise<void>
}
