import { ipcRenderer } from 'electron';
import { join } from 'path';
import { mediaQuickHash, getVideoDir } from '@/libs/utils';
import BaseMediaTaskQueue, { IMediaTask } from './baseMediaTaskQueue';

export type ThumbnailReplyType = {
  imgPath: string,
  videoPath: string,
};

class ThumbnailTask implements IMediaTask<ThumbnailReplyType> {
  private readonly videoPath: string;

  private readonly videoHash: string;

  private readonly imagePath: string;

  private readonly width: number;

  private readonly cols: number;

  private readonly interval: number;

  public constructor(
    videoPath: string,
    videoHash: string,
    imagePath: string,
    interval: number,
    width: number,
    cols: number,
  ) {
    this.videoPath = videoPath;
    this.videoHash = videoHash;
    this.imagePath = imagePath;
    this.width = width;
    this.cols = cols;
    this.interval = interval;
  }

  public static async from(videoPath: string, interval: number, width: number, cols: number) {
    const videoHash = await mediaQuickHash.try(videoPath);
    if (videoHash) {
      const dirPath = await getVideoDir(videoHash);
      const imagePath = join(dirPath, `${[width, cols, interval].join('-')}.jpg`);
      return new ThumbnailTask(videoPath, videoHash, imagePath, interval, width, cols);
    }
    return undefined;
  }

  public getId() {
    return [this.videoHash, this.width, this.cols, this.interval].join('-');
  }

  public async execute(): Promise<ThumbnailReplyType> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send(
        'thumbnail-request',
        this.videoPath,
        this.imagePath,
        this.interval,
        this.width,
        this.cols,
      );
      ipcRenderer.once(
        'thumbnail-reply',
        (event: Event, error: string | null, path: string, videoPath: string) => {
          if (error) reject(new Error(error));
          else resolve({ imgPath: path, videoPath });
        },
      );
    });
  }
}

export default class ThumbnailQueue extends BaseMediaTaskQueue {
  /** get a thumbnail's path, generate it if not exist */
  public async getThumbnailPath(videoPath: string, interval: number, width: number, cols: number) {
    const task = await ThumbnailTask.from(videoPath, interval, width, cols);
    if (this.pendingTasks.length !== 0) {
      this.pendingTasks.splice(0);
    }
    return task ? this.addTask<ThumbnailReplyType>(task) : undefined;
  }
}
