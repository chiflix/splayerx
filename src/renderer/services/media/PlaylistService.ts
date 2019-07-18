import { ipcRenderer, Event } from 'electron';
import { EventEmitter } from 'events';
import { IPlaylistRequest } from '@/interfaces/IPlaylistRequest';
import MediaStorageService from '@/services/storage/MediaStorageService';
import { filePathToUrl } from '@/helpers/path';
import { mediaQuickHash } from '@/libs/utils';
import { info } from '@/libs/DataBase';
import { MediaItem } from '@/interfaces/IDB';
import { getSnapshotPath } from '@/plugins/mediaTasks';

interface IPlaylistEvent {
  'image-loaded': Event
}
export default class PlaylistService extends EventEmitter implements IPlaylistRequest {
  public coverSrc: string;

  public duration: number;

  public record: MediaItem;

  public smallShortCut: string;

  public lastPlayedTime: number;

  public imageSrc: string | undefined;

  private mediaStorageService: MediaStorageService;

  public path: string;

  public videoId?: number;

  public get percentage(): number {
    if (this.lastPlayedTime
        && this.lastPlayedTime / this.duration <= 1) {
      return (this.lastPlayedTime / this.duration) * 100;
    }
    return 0;
  }

  public constructor(mediaStorageService: MediaStorageService, path: string, videoId?: number) {
    super();
    this.mediaStorageService = mediaStorageService;
    this.path = path;
    this.videoId = videoId;
    ipcRenderer.send('mediaInfo', path);
    ipcRenderer.once(`mediaInfo-${path}-reply`, async (event: Event, info: string) => {
      const mediaHash = await mediaQuickHash.try(path);
      if (!mediaHash) return;
      const { duration } = JSON.parse(info).format;
      this.duration = parseFloat(duration);
      const randomNumber = Math.round((Math.random() * 20) + 5);
      const imgPath = await getSnapshotPath(
        path,
        randomNumber > this.duration ? this.duration : randomNumber,
      );
      this.imageSrc = filePathToUrl(`${imgPath}`);
      this.emit('image-loaded');
    });
    this.getRecord(videoId);
  }

  public on<K extends keyof IPlaylistEvent>(type: K, listener: (...args: unknown[]) => void): this {
    return super.on(type, listener);
  }

  /**
   * @param  {string} mediaHash
   * @returns Promise 返回视频封面图片
   */
  public async getCover(mediaHash: string): Promise<string | null> {
    try {
      const result = await this.mediaStorageService.getImageBy(mediaHash, 'cover');
      return result;
    } catch (err) {
      return null;
    }
  }

  /**
   * @param  {number} videoId
   * @returns Promise 获取播放记录
   */
  public async getRecord(videoId?: number): Promise<void> {
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
