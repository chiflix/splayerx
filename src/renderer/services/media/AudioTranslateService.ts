/*
 * @Author: tanghaixiang@xindong.com
 * @Date: 2019-06-20 18:03:14
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-07-25 13:30:53
 */

// @ts-ignore
import { ipcRenderer, Event } from 'electron';
import { EventEmitter } from 'events';
import { isNaN } from 'lodash';
import {
  StreamingTranslationRequest,
  StreamingTranslationResponse,
} from 'sagi-api/translation/v1/translation_pb';
import { AITaskInfo } from '@/interfaces/IMediaStorable';
import sagi from '@/libs/sagi';
import MediaStorageService, { mediaStorageService } from '../storage/MediaStorageService';
import { TranscriptInfo } from '../subtitle';

type JobData = {
  audioId: string,
  mediaHash: string,
  videoSrc: string,
  audioLanguageCode: string,
  targetLanguageCode: string,
}

declare interface AudioTranslateService { // eslint-disable-line
  on(event: 'grab', listener: (time: number) => void): this;
  on(event: 'grabCompleted', listener: () => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'task', listener: (taskInfo: AITaskInfo) => void): this;
  on(event: 'transcriptInfo', listener: (transcriptInfo: TranscriptInfo) => void): this;
}

class AudioTranslateService extends EventEmitter {
  public mediaHash: string;

  public videoSrc: string;

  public audioId: number;

  public audioLanguageCode: string;

  public targetLanguageCode: string;

  public streamClient: any; // eslint-disable-line

  public taskInfo?: AITaskInfo;

  public loopTimer: NodeJS.Timer;

  public timeoutTimer: NodeJS.Timer;

  private mediaStorageService: MediaStorageService;

  private timeoutCount: number;

  public constructor(mediaStorageService: MediaStorageService) {
    super();
    this.mediaStorageService = mediaStorageService;
    this.ipcCallBack = this.ipcCallBack.bind(this);
  }

  public ipcCallBack(event: Event, {
    buffer, end, time,
  }: { buffer: Buffer, end: boolean, time: number }) {
    this.write(buffer);
    if (end) {
      this.emit('grabCompleted');
      if (this.streamClient) {
        this.streamClient.end();
        console.log('write EOF to server', 'audio-log');
        this.streamClient.once('data', this.rpcCallBack.bind(this));
      }
      ipcRenderer.send('grab-audio-stop');
    } else {
      this.emit('grab', time);
      ipcRenderer.send('grab-audio-continue');
    }
  }

  public stop() {
    this.removeAllListeners();
    this.clearJob();
    if (this.streamClient) {
      this.streamClient.removeAllListeners();
      this.streamClient = null;
    }
    ipcRenderer.send('grab-audio-stop');
  }

  private write(framebuf: Buffer) {
    try {
      // fs.appendFileSync('/Users/harry/Desktop/6.pcm', framebuf);
      if (this.streamClient) {
        const request = new StreamingTranslationRequest();
        request.setAudioContent(framebuf);
        this.streamClient.write(request);
      }
    } catch (error) {
      console.warn(error);
    }
  }

  public startJob(data: JobData): AudioTranslateService {
    this.timeoutCount = 3;
    // 计算audioID
    const audioId = Number(data.audioId) - 1;
    this.audioId = isNaN(audioId) ? -1 : audioId;
    // 保存本次任务信息
    this.mediaHash = data.mediaHash;
    this.videoSrc = data.videoSrc;
    this.audioLanguageCode = data.audioLanguageCode;
    this.targetLanguageCode = data.targetLanguageCode;
    // create stream client
    this.streamClient = sagi.streamingTranslation(
      this.mediaHash,
      16000,
      this.audioLanguageCode,
      this.targetLanguageCode,
    );

    this.streamClient.once('data', this.rpcCallBack.bind(this));
    this.streamClient.on('error', this.streamError.bind(this));
    // 开启超时处理
    this.timeOut();
    return this;
  }

  private timeOut() {
    // 开启timeout, 如果在超时时间内收到data，就取消timeout
    // 如果没有收到data，就放弃任务，发送超时错误
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    this.timeoutTimer = setTimeout(() => {
      // 发送error
      this.emit('error', new Error('time out'));
      // 丢弃本次任务
      this.stop();
    }, 1000 * 10);
  }

  private rpcCallBack( // eslint-disable-line complexity
    res: StreamingTranslationResponse,
    err: Error,
  ) {
    // 收到返回数据，清楚超时定时器
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    const result = res && res.toObject();
    console.log(result, err);
    if (result && res.hasTaskinfo() && result.taskinfo) {
      this.taskInfo = {
        mediaHash: this.mediaHash,
        audioLanguageCode: this.audioLanguageCode,
        targetLanguage: this.targetLanguageCode,
        ...result.taskinfo,
      };
      this.emit('task', this.taskInfo);
      this.loopTask(this.taskInfo);
    } else if (result && res.hasTranscriptResult()) {
      // get Transcript Info
      // return hash to render
      this.emit('transcriptInfo', result.transcriptResult);
      this.clearJob();
    } else if (result && result.error && result.error.code === 9100) {
      this.startGrab();
    } else if (result && res.hasError()) {
      // return error to render
      this.emit('error', result.error);
      this.stop();
    } else if (err) {
      this.emit('error', err);
      this.stop();
    }
  }

  private streamError(error: Error) {
    console.log(error, 'audio-log');
    this.emit('error', error);
    // 报错，主动丢弃
    this.stop();
  }

  private startGrab() {
    ipcRenderer.send('grab-audio', {
      videoSrc: this.videoSrc,
      audioId: this.audioId,
    });
    ipcRenderer.removeListener('grab-audio-update', this.ipcCallBack);
    ipcRenderer.on('grab-audio-update', this.ipcCallBack);
  }

  private loopTask(taskInfo: AITaskInfo) {
    const taskId = taskInfo.taskId;
    let delay = Math.ceil((taskInfo.estimateTime / 2));
    // 延迟查询task进度，如果延迟超多10秒，就10秒之后去查询
    delay = delay > 10 ? 10 * 1000 : delay * 1000;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
    }
    this.loopTimer = setTimeout(async () => {
      try {
        const res = await sagi.streamingTranslationTask(taskId);
        const result = res && res.toObject();
        if (result && res.hasTranscriptinfo()) {
          this.emit('transcriptInfo', result.transcriptinfo);
          this.clearJob();
        } else if (result && res.hasTaskinfo() && result.taskinfo) {
          this.taskInfo = {
            audioLanguageCode: this.audioLanguageCode,
            targetLanguage: this.targetLanguageCode,
            mediaHash: this.mediaHash,
            ...result.taskinfo,
          };
          this.emit('task', this.taskInfo);
          // 3次超时内得到返回，重置超时次数
          this.timeoutCount = 3;
          this.loopTask(this.taskInfo);
        } else if (result && res.hasError()) {
          this.emit('error', result.error);
          this.stop();
        }
      } catch (error) {
        if (error && error.message === 'time out' && this.timeoutCount > 0 && this.taskInfo) {
          console.log('time out', 4 - this.timeoutCount, 'audio-log');
          this.timeoutCount -= 1;
          this.loopTask(this.taskInfo);
        } else {
          console.log(error);
          this.emit('error', error);
          this.stop();
        }
      }
    }, delay);
  }

  public clearJob() {
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
    }
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
  }

  public saveTask() {
    const { mediaHash } = this;
    if (this.taskInfo) {
      this.mediaStorageService.setAsyncTaskInfo(mediaHash, this.taskInfo);
    }
  }
}
export default AudioTranslateService;

const audioTranslateService = new AudioTranslateService(mediaStorageService);

export { audioTranslateService };
