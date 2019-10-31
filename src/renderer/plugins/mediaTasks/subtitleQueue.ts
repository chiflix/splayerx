import { join } from 'path';
import { ipcRenderer } from 'electron';
import BaseMediaTaskQueue, { IMediaTask } from './baseMediaTaskQueue';
import { mediaQuickHash, getSubtitleDir } from '@/libs/utils';
import { Format } from '@/interfaces/ISubtitle';


class SubtitleMetadataTask implements IMediaTask<string> {
  private videoPath: string;

  private streamIndex: number;

  private subtitlePath: string;

  public constructor(
    videoPath: string,
    streamIndex: number, subtitlePath: string,
  ) {
    this.videoPath = videoPath;
    this.streamIndex = streamIndex;
    this.subtitlePath = subtitlePath;
  }

  private static formatToExtension(format: Format) {
    switch (format) {
      case Format.AdvancedSubStationAplha:
      case Format.SagiText:
      case Format.SubRip:
      case Format.SubStationAlpha:
      case Format.WebVTT:
        return '.ass';
      case Format.SagiImage:
        return '.sis';
      default:
        throw new Error(`Unknown format: ${format}.`);
    }
  }

  public static async from(videoPath: string, streamIndex: number, format: Format) {
    const hash = await mediaQuickHash(videoPath);
    const subtitlePath = join(await getSubtitleDir(), `${hash}-${streamIndex}${SubtitleMetadataTask.formatToExtension(format)}`);
    return new SubtitleMetadataTask(videoPath, streamIndex, subtitlePath);
  }

  public getId() { return `${['metadata', this.videoPath, this.streamIndex].join('-')}`; }

  public execute(): Promise<string> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('subtitle-metadata-request', this.videoPath, this.streamIndex, this.subtitlePath);
      ipcRenderer.once('subtitle-metadata-reply', (event, error, finished, metadata) => {
        if (error) reject(error);
        else if (finished) reject(new Error('Extraction finished.'));
        else resolve(metadata);
      });
    });
  }
}

class SubtitleCacheTask implements IMediaTask<string | undefined> {
  private readonly videoPath: string;

  private readonly streamIndex: number;

  public constructor(videoPath: string, streamIndex: number) {
    this.videoPath = videoPath;
    this.streamIndex = streamIndex;
  }

  public getId() {
    return `${['cache', this.videoPath, this.streamIndex].join('-')}`;
  }

  public execute(): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('subtitle-cache-request', this.videoPath, this.streamIndex);
      ipcRenderer.once('subtitle-cache-reply', (event, error, path) => {
        if (error) reject(error);
        else resolve(path);
      });
    });
  }
}

class SubtitleFragmentTask implements IMediaTask<Buffer> {
  private readonly videoPath: string;

  private readonly streamIndex: number;

  private readonly videoTime: number;

  public constructor(videoPath: string, streamIndex: number, videoTime: number) {
    this.videoPath = videoPath;
    this.streamIndex = streamIndex;
    this.videoTime = videoTime;
  }

  public getId() {
    return `${[
      'fragment',
      this.videoPath,
      this.streamIndex,
    ].join('-')}`;
  }

  public execute(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('subtitle-stream-request', this.videoPath, this.streamIndex, this.videoTime);
      ipcRenderer.once('subtitle-stream-reply', (event, error, data) => {
        if (error) reject(error);
        else resolve(data);
      });
    });
  }
}

class SubtitleDestroyTask implements IMediaTask<void> {
  private readonly videoPath: string;

  private readonly streamIndex: number;

  public constructor(videoPath: string, streamIndex: number) {
    this.videoPath = videoPath;
    this.streamIndex = streamIndex;
  }

  public getId() {
    return `${['finished', this.videoPath, this.streamIndex].join('-')}`;
  }

  public execute(): Promise<void> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('subtitle-destroy-request', this.videoPath, this.streamIndex);
      ipcRenderer.once('subtitle-destroy-reply', (event, error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

export default class SubtitleQueue extends BaseMediaTaskQueue {
  public getSubtitleMetadata(videoPath: string, streamIndex: number, format: Format) {
    return SubtitleMetadataTask.from(videoPath, streamIndex, format)
      .then(task => super.addTask(task, { piority: 3 }));
  }

  public cacheSubtitle(videoPath: string, streamIndex: number) {
    return super.addTask(new SubtitleCacheTask(videoPath, streamIndex), { piority: 1 });
  }

  public getSubtitleFragment(videoPath: string, streamIndex: number, videoTime: number) {
    return super.addTask(
      new SubtitleFragmentTask(videoPath, streamIndex, videoTime),
      { piority: 2 },
    );
  }

  public stopSubtitleExtraction(videoPath: string, streamIndex: number) {
    const task = new SubtitleDestroyTask(videoPath, streamIndex);
    this.pendingTasks
      .filter(({ id }) => new RegExp(`${videoPath}-${streamIndex}`).test(id))
      .forEach(({ id }) => this.cancelTask(id));
    return super.addTask(task, { piority: 4 });
  }
}
