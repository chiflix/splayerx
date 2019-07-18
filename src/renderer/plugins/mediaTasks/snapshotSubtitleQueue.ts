import { remote, ipcRenderer } from 'electron';
import { join } from 'path';
import { ensureDir } from 'fs-extra';
import { IMediaTask, BaseMediaTaskQueue } from './mediaTaskQueue';
import { timecodeFromSeconds, mediaQuickHash } from '@/libs/utils';
import {
  ELECTRON_CACHE_DIRNAME, DEFAULT_DIRNAME, VIDEO_DIRNAME, SUBTITLE_DIRNAME,
} from '@/constants';
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
    const videoHash = await mediaQuickHash(videoPath);
    await ensureDir(join(
      remote.app.getPath(ELECTRON_CACHE_DIRNAME),
      DEFAULT_DIRNAME,
      VIDEO_DIRNAME,
    ));
    const imagePath = join(
      remote.app.getPath(ELECTRON_CACHE_DIRNAME),
      DEFAULT_DIRNAME,
      VIDEO_DIRNAME,
      videoHash,
      `${[timeInSeconds, width, height].join('-')}.jpg`,
    );
    return new SnapshotTask(
      videoPath, videoHash, imagePath,
      timeInSeconds, width, height,
    );
  }

  public getId() { return [this.videoHash, this.timeString, this.width, this.height].join('-'); }

  public async execute(): Promise<string> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('snapshot-request',
        this.videoPath, this.imagePath,
        this.width, this.height);
      ipcRenderer.once('snapshot-reply', (event, error, path) => {
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
    const videoHash = await mediaQuickHash(videoPath);
    await ensureDir(join(
      remote.app.getPath(ELECTRON_CACHE_DIRNAME),
      DEFAULT_DIRNAME,
      SUBTITLE_DIRNAME,
    ));
    const subtitlePath = join(
      remote.app.getPath(ELECTRON_CACHE_DIRNAME),
      DEFAULT_DIRNAME,
      SUBTITLE_DIRNAME,
      `${[videoHash, streamIndex].join('-')}.${formatToExtension(format)}`,
    );
    return new SubtitleTask(
      videoPath, videoHash, subtitlePath,
      streamIndex,
    );
  }

  public getId() { return `${[this.videoHash, this.streamIndex]}`; }

  public execute(): Promise<string> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('subtitle-request',
        this.videoPath, this.subtitlePath,
        `0:${this.streamIndex}:0`);
      ipcRenderer.once('subtitle-reply', (event, error, path) => {
        if (error) reject(error);
        else resolve(path);
      });
    });
  }
}

export class SnapshotSubtitleQueue extends BaseMediaTaskQueue {
  public async getSnapshotPath(
    videoPath: string,
    timeInSeconds: number,
    width: number, height: number,
  ) {
    try {
      const result = await super.addTask<string>(await SnapshotTask.from(
        videoPath,
        timeInSeconds,
        width, height,
      ));
      if (result as unknown instanceof Error) return '';
      return result;
    } catch (err) { return ''; }
  }

  public async getSubtitlePath(videoPath: string, streamIndex: number, format: Format) {
    try {
      const result = await super.addTask<string>(await SubtitleTask.from(
        videoPath, streamIndex, format,
      ));
      if (result as unknown instanceof Error) return '';
      return result;
    } catch (err) { return ''; }
  }
}
