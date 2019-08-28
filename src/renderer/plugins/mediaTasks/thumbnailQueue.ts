import { ipcRenderer } from 'electron';
import { join } from 'path';
import BaseMediaTaskQueue, { IMediaTask } from './baseMediaTaskQueue';
import { mediaQuickHash, getVideoDir } from '@/libs/utils';

class ThumbnailTask implements IMediaTask<string> {
  private readonly videoPath: string;

  private readonly videoHash: string;

  private readonly imagePath: string;

  private readonly width: number;

  private readonly cols: number;

  private readonly interval: number;

  public constructor(
    videoPath: string, videoHash: string, imagePath: string,
    interval: number, width: number, cols: number,
  ) {
    this.videoPath = videoPath;
    this.videoHash = videoHash;
    this.imagePath = imagePath;
    this.width = width;
    this.cols = cols;
    this.interval = interval;
  }

  public static async from(
    videoPath: string, interval: number, width: number, cols: number,
  ) {
    const videoHash = await mediaQuickHash.try(videoPath);
    if (videoHash) {
      const dirPath = await getVideoDir(videoHash);
      const imagePath = join(dirPath, `${[width, cols, interval].join('-')}.jpg`);
      return new ThumbnailTask(
        videoPath, videoHash, imagePath,
        interval, width, cols,
      );
    }
    return undefined;
  }

  public getId() { return [this.videoHash, this.width, this.cols, this.interval].join('-'); }

  public async execute(): Promise<string> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('thumbnail-request',
        this.videoPath, this.imagePath, this.interval, this.width, this.cols);
      ipcRenderer.once('thumbnail-reply', (event, error: string | null, path: string) => {
        if (error) reject(new Error(error));
        else resolve(path);
      });
    });
  }
}

export default class ThumbnailQueue extends BaseMediaTaskQueue {
  /** get a thumbnail's path, generate it if not exist */
  public async getThumbnailPath(
    videoPath: string, interval: number, width: number, cols: number,
  ) {
    const task = await ThumbnailTask.from(
      videoPath,
      interval,
      width,
      cols,
    );
    return task ? super.addTask<string>(task) : undefined;
  }
}
