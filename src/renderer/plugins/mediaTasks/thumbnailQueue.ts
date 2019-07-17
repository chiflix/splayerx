import { ipcRenderer, remote } from 'electron';
import { MediaTask, BaseMediaTaskQueue } from './mediaTaskQueue';
import { mediaQuickHash } from '@/libs/utils';
import { join } from 'path';
import { ELECTRON_CACHE_DIRNAME, DEFAULT_DIRNAME, VIDEO_DIRNAME } from '@/constants';
const mediaDirPath = join(
  remote.app.getPath(ELECTRON_CACHE_DIRNAME),
  DEFAULT_DIRNAME,
  VIDEO_DIRNAME,
);

class ThumbnailTask implements MediaTask<string> {
  private readonly videoPath: string;

  private readonly videoHash: string;

  private readonly imagePath: string;

  private readonly width: number;

  private readonly rowCount: number;

  private readonly columnCount: number;

  constructor(
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
    const videoHash = await mediaQuickHash(videoPath);
    const imagePath = join(
      mediaDirPath,
      videoHash,
      `${[width, rowCount, columnCount].join('-')}.jpg`,
    );
    return new ThumbnailTask(
      videoPath, videoHash, imagePath,
      width,
      rowCount, columnCount,
    );
  }

  getId() { return [this.videoHash, this.width, this.rowCount, this.columnCount].join('-'); }

  async execute(): Promise<string> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('generate-thumbnail-request',
        this.videoPath, this.imagePath,
        this.width,
        this.rowCount, this.columnCount,
      );
      ipcRenderer.once('generate-thumbnail-reply', (event, error, path) => {
        if (error) reject(error);
        else resolve(path);
      });
    });
  }
}
export class ThumbnailQueue extends BaseMediaTaskQueue {
  async getThumbnailPath(
    videoPath: string,
    width: number,
    rowCount: number, columnCount: number,
  ) {
    return super.addTask<string>(await ThumbnailTask.from(
      videoPath,
      width,
      rowCount, columnCount,
    ));
  }
}
