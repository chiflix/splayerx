import { ipcRenderer } from 'electron';
import { join } from 'path';
import BaseMediaTaskQueue, { IMediaTask } from './baseMediaTaskQueue';
import {
  timecodeFromSeconds, mediaQuickHash,
  getVideoDir,
} from '@/libs/utils';

class SnapshotTask implements IMediaTask<string> {
  private readonly videoPath: string;

  private readonly videoHash: string;

  private readonly imagePath: string;

  private readonly timeString: string;

  private readonly width: number;

  private readonly height: number;

  public constructor(
    videoPath: string, videoHash: string, imagePath: string,
    timeInSeconds: number,
    width: number, height: number,
  ) {
    this.videoPath = videoPath;
    this.videoHash = videoHash;
    this.imagePath = imagePath;
    this.timeString = timecodeFromSeconds(timeInSeconds);
    this.width = width;
    this.height = height;
  }

  public static async from(
    videoPath: string,
    timeInSeconds: number,
    width: number, height: number,
  ) {
    const videoHash = await mediaQuickHash(videoPath);
    const dirPath = await getVideoDir(videoHash);
    const imagePath = join(dirPath, 'cover.jpg');
    return new SnapshotTask(
      videoPath, videoHash, imagePath,
      timeInSeconds, width, height,
    );
  }

  public getId() { return [this.videoHash, this.width, this.height].join('-'); }

  public async execute(): Promise<string> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('snapshot-request',
        this.videoPath, this.imagePath,
        this.timeString,
        this.width, this.height);
      ipcRenderer.once('snapshot-reply', (event, error, path) => {
        if (error) reject(error);
        else resolve(path);
      });
    });
  }
}

export default class SnapshotQueue extends BaseMediaTaskQueue {
  /** get snapshot path, generate it if not exist */
  public getSnapshotPath(
    videoPath: string,
    timeInSeconds: number,
    width: number, height: number,
  ) {
    return SnapshotTask.from(
      videoPath,
      timeInSeconds,
      width, height,
    ).then(task => super.addTask<string>(task));
  }
}
