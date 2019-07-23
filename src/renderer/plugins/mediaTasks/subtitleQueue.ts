import { ipcRenderer } from 'electron';
import { join } from 'path';
import BaseMediaTaskQueue, { IMediaTask } from './baseMediaTaskQueue';
import { mediaQuickHash, getSubtitleDir } from '@/libs/utils';
import { Format } from '@/interfaces/ISubtitle';
import { formatToExtension } from '@/services/subtitle/utils';

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
    const dirPath = await getSubtitleDir();
    const subtitlePath = join(dirPath, `${[videoHash, streamIndex].join('-')}.${formatToExtension(format)}`);
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

export default class SubtitleQueue extends BaseMediaTaskQueue {
  /** get a embedded subtitle path, extract it if not exist */
  public getSubtitlePath(videoPath: string, streamIndex: number, format: Format) {
    return SubtitleTask.from(videoPath, streamIndex, format)
      .then(task => super.addTask<string>(task));
  }
}
