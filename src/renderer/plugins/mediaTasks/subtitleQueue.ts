import { join } from 'path';
import { ipcRenderer } from 'electron';
import BaseMediaTaskQueue, { IMediaTask } from './baseMediaTaskQueue';
import { mediaQuickHash, getSubtitleDir } from '@/libs/utils';
import { Format } from '@/interfaces/ISubtitle';

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

  public static async from(videoPath: string, streamIndex: number) {
    const videoHash = await mediaQuickHash(videoPath);
    const dirPath = await getSubtitleDir();
    const subtitlePath = join(dirPath, `${[videoHash, streamIndex].join('-')}.${Format.AdvancedSubStationAplha}`);
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
        this.streamIndex);
      ipcRenderer.on('subtitle-reply', (event, error, finished, path) => {
        if (error) reject(error);
        else if (!finished) {
          ipcRenderer.send('subtitle-request',
            this.videoPath, this.subtitlePath,
            this.streamIndex);
        } else if (finished) {
          ipcRenderer.removeAllListeners('subtitle-reply');
          resolve(path);
        }
      });
    });
  }
}

export default class SubtitleQueue extends BaseMediaTaskQueue {
  /** get a embedded subtitle path, extract it if not exist */
  public getSubtitlePath(videoPath: string, streamIndex: number) {
    return SubtitleTask.from(videoPath, streamIndex)
      .then(task => super.addTask<string>(task));
  }
}
