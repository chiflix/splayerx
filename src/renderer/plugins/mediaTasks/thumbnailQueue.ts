import { ipcRenderer } from 'electron';
import { join } from 'path';
import BaseMediaTaskQueue, { IMediaTask } from './baseMediaTaskQueue';
import { mediaQuickHash, getVideoDir } from '@/libs/utils';

class ThumbnailTask implements IMediaTask<string> {
  private readonly videoPath: string;

  private readonly videoHash: string;

  private readonly imagePath: string;

  private readonly width: number;

  private readonly rowCount: number;

  private readonly columnCount: number;

  public constructor(
    videoPath: string, videoHash: string, imagePath: string,
    width: number,
    rowCount: number, columnCount: number,
  ) {
    this.videoPath = videoPath;
    this.videoHash = videoHash;
    this.imagePath = imagePath;
    this.width = width;
    this.rowCount = rowCount;
    this.columnCount = columnCount;
  }

  public static async from(
    videoPath: string,
    width: number,
    rowCount: number, columnCount: number,
  ) {
    const videoHash = await mediaQuickHash.try(videoPath);
    if (videoHash) {
      const dirPath = await getVideoDir(videoHash);
      const imagePath = join(dirPath, `${[width, rowCount, columnCount].join('-')}.jpg`);
      return new ThumbnailTask(
        videoPath, videoHash, imagePath,
        width,
        rowCount, columnCount,
      );
    }
    return undefined;
  }

  public getId() { return [this.videoHash, this.width, this.rowCount, this.columnCount].join('-'); }

  public async execute(): Promise<string> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('thumbnail-request',
        this.videoPath, this.imagePath,
        this.width,
        this.rowCount, this.columnCount);
      ipcRenderer.once('thumbnail-reply', (event, error, path) => {
        if (error) reject(error);
        else resolve(path);
      });
    });
  }
}

export default class ThumbnailQueue extends BaseMediaTaskQueue {
  /** get a thumbnail's path, generate it if not exist */
  public async getThumbnailPath(
    videoPath: string,
    width: number,
    rowCount: number, columnCount: number,
  ) {
    const task = await ThumbnailTask.from(
      videoPath,
      width,
      rowCount, columnCount,
    );
    return task ? super.addTask<string>(task) : undefined;
  }
}
