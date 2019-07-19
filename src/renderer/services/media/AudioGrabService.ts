/*
 * @Author: tanghaixiang@xindong.com
 * @Date: 2019-06-20 18:03:14
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-07-19 17:38:41
 */

// @ts-ignore
import { splayerx, ipcRenderer, Event } from 'electron';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import { isNaN } from 'lodash';
import { credentials, Metadata } from 'grpc';
import {
  StreamingTranslationRequest,
  StreamingTranslationRequestConfig,
  StreamingTranslationResponse,
  StreamingTranslationTaskRequest,
  StreamingTranslationTaskResponse,
} from 'sagi-api/translation/v1/translation_pb';
import { TranslationClient } from 'sagi-api/translation/v1/translation_grpc_pb';
import { AITaskInfo } from '@/interfaces/IMediaStorable';
import MediaStorageService, { mediaStorageService } from '../storage/MediaStorageService';
import { TranscriptInfo } from '../subtitle';

let endpoint = '';
if (process.env.NODE_ENV === 'production') {
  endpoint = 'apis.sagittarius.ai:8443';
} else {
  endpoint = 'apis.stage.sagittarius.ai:8443';
}

enum Status {
  Grab = 'grab',
  GrabCompleted = 'grab-completed',
  Task = 'task',
  Error = 'error',
  TranscriptInfo = 'transcriptInfo',
}

type JobData = {
  audioId: string,
  mediaHash: string,
  videoSrc: string,
  audioLanguageCode: string,
  targetLanguageCode: string,
  callback?: Function,
}

declare interface AudioGrabService { // eslint-disable-line
  on(event: 'grab', listener: (time: number) => void): this;
  on(event: 'grabCompleted', listener: () => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'task', listener: (taskInfo: AITaskInfo) => void): this;
  on(event: 'transcriptInfo', listener: (transcriptInfo: TranscriptInfo) => void): this;
}

class AudioGrabService extends EventEmitter {
  public mediaHash: string;

  public videoSrc: string;

  public audioId: number;

  public pts: string = '0';

  public audioChannel: number = 0;

  public rate: number = 16000;

  public audioLanguageCode: string;

  public targetLanguageCode: string;

  public streamClient: any; // eslint-disable-line

  public queue: [JobData];

  public callback: Function;

  public taskInfo?: AITaskInfo;

  public startTime: number;

  public grabEndTime: number;

  public translationEndTime: number;

  public loopTimer: NodeJS.Timeout;

  public timeoutTimer: NodeJS.Timeout;

  public grabTime: number;

  public _count: number;

  public _pkgSize: number;

  private mediaStorageService: MediaStorageService;

  public constructor(mediaStorageService: MediaStorageService) {
    super();
    this.mediaStorageService = mediaStorageService;
    this.ipcCallBack = this.ipcCallBack.bind(this);
  }

  public send(data: JobData): AudioGrabService {
    this.mediaHash = data.mediaHash;
    this.videoSrc = data.videoSrc;
    this.audioLanguageCode = data.audioLanguageCode;
    this.targetLanguageCode = data.targetLanguageCode;
    ipcRenderer.send('grab-audio', data);
    ipcRenderer.removeListener('grab-audio-change', this.ipcCallBack);
    ipcRenderer.on('grab-audio-change', this.ipcCallBack);
    return this;
  }

  public ipcCallBack(event: Event, args: any) { // eslint-disable-line
    if (args.grabInfo) {
      switch (args.grabInfo.status) {
        case Status.Grab:
          this.emit('grab', args.grabInfo.progressTime);
          break;
        case Status.GrabCompleted:
          this.emit('grabCompleted');
          break;
        case Status.Error:
          this.emit('error', args.grabInfo.error);
          break;
        case Status.Task:
          this.emit('task', args.grabInfo.taskInfo);
          break;
        case Status.TranscriptInfo:
          this.emit('transcriptInfo', args.grabInfo.transcriptInfo);
          break;
        default:
          break;
      }
    }
  }

  public remove() {
    ipcRenderer.send('grab-audio-stop');
    ipcRenderer.removeListener('grab-audio-change', this.ipcCallBack);
    this.removeAllListeners();
  }

  public stop() {
    this.clearJob();
    this.pts = '0';
    if (this.streamClient) {
      splayerx.stopGrabAudioFrame();
      this.streamClient = null;
    }
  }

  public saveTask() {
    const { mediaHash, targetLanguageCode } = this;
    if (this.taskInfo) {
      mediaStorageService.setAsyncTaskInfo(`${mediaHash}-${targetLanguageCode}`, this.taskInfo);
    }
  }

  private grabAudio() {
    const {
      videoSrc, pts, audioChannel, rate, handleCallBack, audioId,
    } = this;
    splayerx.grabAudioFrame(
      videoSrc, // 需要提取音频的视频文件路径
      `${pts}`, // seek位置
      audioId, // 音轨
      audioChannel, // 需要提取的声道, [1,8] 0代表提取所有声道
      1, // 重采样的声道[1,8] 1代表单声道
      rate, // 采样频率
      1, // 采样存储格式 0 代表 AV_SAMPLE_FMT_U8
      200, // 一次性待提取的帧数
      handleCallBack.bind(this),
    );
  }

  private handleCallBack(err: string, framebuf: Buffer, framedata: string) {
    if (!this.streamClient && this.taskInfo && this.taskInfo.taskId) {
      return;
    }
    if (err !== 'EOF' && framedata && framebuf && this.streamClient) {
      this._count += 1;
      const s = framedata.split(',');
      this.pts = s[0];
      this.grabTime += (Number(s[3]) / this.rate);
      this.write(framebuf);
      this.callback({
        status: Status.Grab,
        progressTime: this.grabTime,
      });
      setTimeout(() => {
        this.grabAudio();
      }, 0);
    } else if (err === 'EOF' && this.streamClient) {
      this.write(framebuf);
      this.streamClient.end();
      this.streamClient = null;
      this._count += 1;
      console.warn('EOF', this._count);
      if (this.callback) {
        this.callback({
          status: Status.GrabCompleted,
        });
      }
    } else if (this.streamClient) {
      // TODO 处理grabAudioFrame error ，有些视频直接不能，就返回error
      setTimeout(() => {
        this.grabAudio();
      }, 20);
    } else {
      // empty
    }
  }

  private write(framebuf: Buffer) {
    try {
      // fs.appendFileSync('/Users/harry/Desktop/6.pcm', framebuf);
      const request = new StreamingTranslationRequest();
      request.setAudioContent(framebuf);
      this.streamClient.write(request);
    } catch (error) {
      console.warn(error);
    }
  }

  public push(data: JobData, callback: Function) {
    data.callback = callback;
    if (this.queue) {
      this.queue.push(data);
    } else {
      this.queue = [data];
    }
    if (this.queue.length === 1) {
      const job = this.queue.shift();
      if (job) {
        this.startJob(job);
      }
    }
  }

  private startJob(data: JobData) {
    this.mediaHash = data.mediaHash;
    this.videoSrc = data.videoSrc;
    this.audioLanguageCode = data.audioLanguageCode;
    this.targetLanguageCode = data.targetLanguageCode;
    const audioId = Number(data.audioId) - 1;
    this.audioId = isNaN(audioId) ? -1 : audioId;
    if (data.callback) {
      this.callback = data.callback;
    }
    // create stream client
    this.streamClient = this.openClient();

    // send config
    const request = new StreamingTranslationRequest();
    const requestConfig = new StreamingTranslationRequestConfig();
    // @ts-ignore
    const audioConfig = new global.proto.google.cloud.speech.v1
      .RecognitionConfig([1, this.rate, this.audioLanguageCode]);
    requestConfig.setStreamingConfig(audioConfig);
    requestConfig.setAudioLanguageCode(this.audioLanguageCode);
    requestConfig.setTargetLanguageCode(this.targetLanguageCode);
    requestConfig.setMediaIdentity(data.mediaHash);
    request.setStreamingConfig(requestConfig);
    this.streamClient.write(request);
    this.streamClient.once('data', this.rpcCallBack.bind(this));
    // 开启超时处理
    this.timeOut();
  }

  private startGrab() {
    // start grab data
    this.pts = '0';
    this._count = 0;
    this._pkgSize = 0;
    this.grabTime = 0;
    this.grabAudio();

    this.startTime = Date.now();
    this.streamClient.once('data', this.rpcCallBack.bind(this));
  }

  private openClient(): any { // eslint-disable-line
    const sslCreds = credentials.createSsl(
      // @ts-ignore
      fs.readFileSync(path.join(__static, '/certs/ca.pem')),
      // @ts-ignore
      fs.readFileSync(path.join(__static, '/certs/key.pem')),
      // @ts-ignore
      fs.readFileSync(path.join(__static, '/certs/cert.pem')),
    );
    const metadataUpdater = (_: {}, cb: Function) => {
      const metadata = new Metadata();
      cb(null, metadata);
    };
    const metadataCreds = credentials.createFromMetadataGenerator(metadataUpdater);
    const combinedCreds = credentials.combineChannelCredentials(sslCreds, metadataCreds);
    const client = new TranslationClient(endpoint, combinedCreds);
    const stream = client.streamingTranslation();
    stream.once('error', (error: Error) => {
      try {
        console.log(error, 'audio-log');
      } catch (err) {
        console.warn('error');
      }
      // 报错，主动丢弃
      this.stop();
      if (this.callback) {
        this.callback({
          status: Status.Error,
          error,
        });
      }
    });
    return stream;
  }

  private timeOut() {
    // 开启timeout, 如果在超时时间内收到data，就取消timeout
    // 如果没有收到data，就放弃任务，发送超时错误
    this.timeoutTimer = setTimeout(() => {
      // 丢弃本次任务
      this.stop();
      // 发送error
      if (this.callback) {
        this.callback({
          status: Status.Error,
          error: new Error('time out'),
        });
      }
    }, 1000 * 50);
    // TODO timeout reset 10s
  }

  private rpcCallBack( // eslint-disable-line complexity
    res: StreamingTranslationResponse,
    err: Error,
  ) {
    try {
      console.log(err, res.toObject(), 'rpcCallBack', 'audio-log');
    } catch (err) {
      console.warn('error');
    }
    // 收到返回数据，清楚超时定时器
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    const result = res && res.toObject();
    if (result && res.hasTaskinfo() && result.taskinfo) {
      this.grabEndTime = Date.now();
      this.taskInfo = {
        mediaHash: this.mediaHash,
        audioLanguageCode: this.audioLanguageCode,
        targetLanguage: this.targetLanguageCode,
        ...result.taskinfo,
      };
      // if streamClient exist end my stream
      if (this.streamClient) {
        this.streamClient.end();
        this.streamClient = null;
      }
      // return task to render
      this.callback({
        status: Status.Task,
        taskInfo: this.taskInfo,
      });
      this.loopTask(this.taskInfo);
    } else if (result && res.hasTranscriptResult()) {
      // get Transcript Info
      // return hash to render
      this.translationEndTime = Date.now();
      this.callback({
        status: Status.TranscriptInfo,
        transcriptInfo: result.transcriptResult,
      });
      this.clearJob();
    } else if (result && result.error && result.error.code === 9100) {
      this.startGrab();
    } else if (result && res.hasError()) {
      // return error to render
      this.stop();
      this.callback({
        status: Status.Error,
        error: result.error,
      });
    } else if (err) {
      this.stop();
      this.callback({
        status: Status.Error,
        error: err,
      });
    }
  }

  public loopTask(taskInfo: AITaskInfo) {
    const taskId = taskInfo.taskId;
    let delay = Math.ceil((taskInfo.estimateTime / 2));
    // 延迟查询task进度，如果延迟超多10秒，就10秒之后去查询
    delay = delay > 10 ? 10 * 1000 : delay * 1000;
    const callback = this.loopTaskCallBack.bind(this);
    this.loopTimer = setTimeout(() => {
      const sslCreds = credentials.createSsl(
        // @ts-ignore
        fs.readFileSync(path.join(__static, '/certs/ca.pem')),
        // @ts-ignore
        fs.readFileSync(path.join(__static, '/certs/key.pem')),
        // @ts-ignore
        fs.readFileSync(path.join(__static, '/certs/cert.pem')),
      );
      const metadataUpdater = (_: {}, cb: Function) => {
        const metadata = new Metadata();
        cb(null, metadata);
      };
      const metadataCreds = credentials.createFromMetadataGenerator(metadataUpdater);
      const combinedCreds = credentials.combineChannelCredentials(sslCreds, metadataCreds);
      const client = new TranslationClient(endpoint, combinedCreds);
      const taskRequest = new StreamingTranslationTaskRequest();
      taskRequest.setTaskId(taskId);
      client.streamingTranslationTask(taskRequest, callback);
      // 添加超时
      this.timeOut();
    }, delay);
  }

  private loopTaskCallBack(err: Error | null, res: StreamingTranslationTaskResponse) {
    try {
      console.error(res.toObject(), err, 'loopTaskCallBack', 'audio-log');
    } catch (err) {
      console.warn('error');
    }
    // 收到返回数据，清楚超时定时器
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    const result = res && res.toObject();
    if (result && res.hasTranscriptinfo()) {
      this.translationEndTime = Date.now();
      this.callback({
        status: Status.TranscriptInfo,
        transcriptInfo: result.transcriptinfo,
      });
    } else if (result && res.hasTaskinfo() && result.taskinfo) {
      this.taskInfo = {
        audioLanguageCode: this.audioLanguageCode,
        targetLanguage: this.targetLanguageCode,
        mediaHash: this.mediaHash,
        ...result.taskinfo,
      };
      this.callback({
        status: Status.Task,
        taskInfo: this.taskInfo,
      });
      this.loopTask(this.taskInfo);
    } else if (result && res.hasError()) {
      this.stop();
      this.callback({
        status: Status.Error,
        error: result.error,
      });
    } else if (err) {
      this.stop();
      this.callback({
        status: Status.Error,
        error: err,
      });
    }
  }

  public clearJob() {
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
    }
  }
}
export default AudioGrabService;

const audioGrabService = new AudioGrabService(mediaStorageService);

export { audioGrabService };
