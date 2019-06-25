import { IPlaylistRequest } from '@/interfaces/IPlaylistRequest';
import MediaStorageService from '@/services/storage/MediaStorageService';
import { ipcRenderer } from 'electron';
import { filePathToUrl } from '@/helpers/path';
import { mediaQuickHash } from "@/libs/utils";
import { info } from '@/libs/DataBase';
import { MediaItem } from '@/interfaces/IDB';
import { EventEmitter } from 'events';

interface PlaylistEvent {
  "image-loaded": Event
}
export default class PlaylistService extends EventEmitter implements IPlaylistRequest {
  coverSrc: string;
  duration: any;
  record: MediaItem;
  smallShortCut: string;
  lastPlayedTime: number;
  imageSrc: string | undefined;

  get percentage(): number {
    if (this.lastPlayedTime
        && this.lastPlayedTime / this.duration <= 1) {
      return (this.lastPlayedTime / this.duration) * 100;
    }
    return 0;
  }

  constructor(private readonly mediaStorageService: MediaStorageService, readonly path: string, readonly videoId?: number) {
    super();
    ipcRenderer.send('mediaInfo', path);
    ipcRenderer.once(`mediaInfo-${path}-reply`, async (event: any, info: string) => {
      const { width, height } = JSON.parse(info).streams.find((stream: any) => stream.codec_type === 'video');

      const { duration } = JSON.parse(info).format;
      this.duration = parseFloat(duration);
      const mediaHash = await mediaQuickHash(path);
      const imgPath = await this.getCover(mediaHash);
      
      if (!imgPath) {
        const imgPath = await this.mediaStorageService.generatePathBy(mediaHash, 'cover');
        ipcRenderer.send('snapShot', { path, imgPath, duration, width, height });
        ipcRenderer.once(`snapShot-${path}-reply`, (event: any, imgPath: string) => {
          this.imageSrc = filePathToUrl(`${imgPath}`);
          this.emit('image-loaded');
        });
      } else {
        this.imageSrc = filePathToUrl(`${imgPath}`);
        this.emit('image-loaded');
      }
    });
    this.getRecord(videoId);
  }
  on<K extends keyof PlaylistEvent>(type: K, listener: (...args: any[]) => void): this {
    return super.on(type, listener);
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
  /**
   * @param  {number} videoId
   * @returns Promise 获取播放记录
   */
  async getRecord(videoId?: number): Promise<void> {
    let record;
    if (videoId) {
      record = await info.getValueByKey('media-item', videoId);
    } else {
      const records = await info.getAllValueByIndex('media-item', 'source', '');
      record = records.find(record => record.path === this.path);
    }
    if (record) {
      this.record = record;
      if (this.record.lastPlayedTime) {
        this.lastPlayedTime = this.record.lastPlayedTime;
        this.imageSrc = this.record.smallShortCut;
      }
    }
  }
}