// @ts-ignore
import { ipcRenderer } from 'electron';
import { join } from 'path';
import BaseMediaTaskQueue, { IMediaTask } from './baseMediaTaskQueue';
import {
  timecodeFromSeconds, mediaQuickHash,
  getVideoDir, getSubtitleDir,
} from '@/libs/utils';
import { Format } from '@/interfaces/ISubtitle';
import { formatToExtension } from '@/services/subtitle/utils';

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
    const videoHash = await mediaQuickHash.try(videoPath);
    if (videoHash) {
      const dirPath = await getVideoDir(videoHash);
      const imagePath = join(dirPath, 'cover.jpg');
      return new SnapshotTask(
        videoPath, videoHash, imagePath,
        timeInSeconds, width, height,
      );
    }
    return undefined;
  }

  public getId() { return [this.videoHash, this.width, this.height].join('-'); }

  public async execute(): Promise<string> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('snapshot-request',
        this.videoPath, this.imagePath,
        this.timeString,
        this.width, this.height);
      ipcRenderer.once('snapshot-reply', (event: Event, error: Error | null, path: string) => {
        if (error) reject(error);
        else resolve(path);
      });
    });
  }
}

class SubtitleTask implements IMediaTask<string> {
  private readonly videoPath: string;

  private readonly videoHash: string;

  private readonly subtitlePath: string;

  private readonly streamIndex: number;

  public constructor(
    videoPath: string, videoHash: string, subtitlePath: string,
    streamIndex: number,
  ) {
    this.videoPath = videoPath;
    this.videoHash = videoHash;
    this.subtitlePath = subtitlePath;
    this.streamIndex = streamIndex;
  }

  public static async from(videoPath: string, streamIndex: number, format: Format) {
    const videoHash = await mediaQuickHash.try(videoPath);
    if (videoHash) {
      const dirPath = await getSubtitleDir();
      const subtitlePath = join(dirPath, `${[videoHash, streamIndex].join('-')}.${formatToExtension(format)}`);
      return new SubtitleTask(
        videoPath, videoHash, subtitlePath,
        streamIndex,
      );
    }
    return undefined;
  }

  public getId() { return `${[this.videoHash, this.streamIndex]}`; }

  public execute(): Promise<string> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('subtitle-request',
        this.videoPath, this.subtitlePath,
        `0:${this.streamIndex}:0`);
      ipcRenderer.once('subtitle-reply', (event: Event, error: Error | null, path: string) => {
        if (error) reject(error);
        else resolve(path);
      });
    });
  }
}

export default class SnapshotSubtitleQueue extends BaseMediaTaskQueue {
  /** get snapshot path, generate it if not exist */
  public async getSnapshotPath(
    videoPath: string,
    timeInSeconds: number,
    width: number, height: number,
  ) {
    const task = await SnapshotTask.from(
      videoPath,
      timeInSeconds,
      width, height,
    );
    return task ? super.addTask<string>(task) : '';
  }

  /** get a embedded subtitle path, extract it if not exist */
  public async getSubtitlePath(videoPath: string, streamIndex: number, format: Format) {
    const task = await SubtitleTask.from(videoPath, streamIndex, format);
    return task ? super.addTask<string>(task) : '';
  }
}
