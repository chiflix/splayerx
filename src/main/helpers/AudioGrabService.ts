/*
 * @Author: tanghaixiang@xindong.com
 * @Date: 2019-07-22 17:18:34
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-09-11 18:06:25
 */

import { EventEmitter } from 'events';
// @ts-ignore
import { splayerx } from 'electron';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { credentials, Metadata } from 'grpc';

import { TranslationClient } from 'sagi-api/translation/v1/translation_grpc_pb';
import {
  StreamingTranslationResponse,
  StreamingTranslationRequest,
  StreamingTranslationRequestConfig,
} from 'sagi-api/translation/v1/translation_pb';
import { IAudioStream } from '@/plugins/mediaTasks/mediaInfoQueue';

type JobData = {
  videoSrc: string,
  audioId: number,
  audioInfo?: IAudioStream,
  mediaHash: string,
  audioLanguageCode: string,
  targetLanguageCode: string,
  uuid: string,
  agent: string,
}

const endpoint = process.env.SAGI_API as string;
export default class AudioGrabService extends EventEmitter {
  private uuid: string;

  private agent: string;

  private mediaHash: string;

  private audioLanguageCode: string;

  private targetLanguageCode: string;

  private videoSrc: string;

  private audioId: number;

  private audioInfo?: IAudioStream;

  private pts: string;

  private audioChannel: number;

  private rate: number = 16000;

  private grabTime: number;

  private queue: [JobData];

  private status: number; // 0 grab, 1 stop

  public streamClient: any; // eslint-disable-line

  public timeoutTimer: NodeJS.Timer;

  public start(data: JobData) {
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

  public startJob(data: JobData) {
    this.status = 0;
    // 计算audioID
    this.videoSrc = data.videoSrc;
    this.audioId = data.audioId;
    this.audioInfo = data.audioInfo;
    // 保存本次任务信息
    this.mediaHash = data.mediaHash;
    this.videoSrc = data.videoSrc;
    this.audioLanguageCode = data.audioLanguageCode;
    this.targetLanguageCode = data.targetLanguageCode;
    this.agent = data.agent;
    this.uuid = data.uuid;
    // create stream client
    this.streamClient = this.openClient();

    // send config
    const request = new StreamingTranslationRequest();
    const requestConfig = new StreamingTranslationRequestConfig();
    // @ts-ignore
    const audioConfig = new global.proto.google.cloud.speech.v1
      .RecognitionConfig([1, this.rate, this.audioLanguageCode]);
    // 1 LINEAR16, 2 FLAC, 3 MULAW, 4 AMR, 5 AMR_WB, 6 OGG_OPUS
    requestConfig.setStreamingConfig(audioConfig);
    requestConfig.setAudioLanguageCode(this.audioLanguageCode);
    requestConfig.setTargetLanguageCode(this.targetLanguageCode);
    requestConfig.setMediaIdentity(this.mediaHash);
    requestConfig.setAudioTrack(String(this.audioId));
    request.setStreamingConfig(requestConfig);
    this.streamClient.write(request);
    this.streamClient.once('data', this.grpcCallBack.bind(this));
    this.streamClient.once('error', this.streamError.bind(this));
    // 开启超时处理
    this.timeOut();
    return this;
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
    if (this.status === 1) return;
    if (err !== 'EOF' && framedata && framebuf) {
      const s = framedata.split(',');
      this.pts = s[0];
      this.grabTime += (Number(s[3]) / this.rate);
      this.write(framebuf);
      this.emit('data', {
        time: this.grabTime,
        end: false,
      });
      setTimeout(() => {
        this.grabAudio();
      }, 0);
    } else if (err === 'EOF') {
      this.write(framebuf);
      this.emit('data', {
        time: this.grabTime,
        end: true,
      });
      if (this.streamClient) {
        this.streamClient.end();
      }
    } else {
      // TODO 处理grabAudioFrame error ，有些视频直接不能，就返回error
      setTimeout(() => {
        this.grabAudio();
      }, 20);
    }
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
      // empty
    }
  }

  private openClient(): any { // eslint-disable-line
    const { uuid, agent } = this;
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
      metadata.set('uuid', uuid);
      metadata.set('agent', agent);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      axios.get('https://ip.xindong.com/myip', { responseType: 'text' }).then((response: any) => {
        metadata.set('clientip', response.data);
        cb(null, metadata);
      }, () => {
        cb(null, metadata);
      });
    };
    const metadataCreds = credentials.createFromMetadataGenerator(metadataUpdater);
    const combinedCreds = credentials.combineChannelCredentials(sslCreds, metadataCreds);
    const client = new TranslationClient(endpoint, combinedCreds);
    const stream = client.streamingTranslation();
    return stream;
  }

  private timeOut() {
    // 开启timeout, 如果在超时时间内收到data，就取消timeout
    // 如果没有收到data，就放弃任务，发送超时错误
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    this.timeoutTimer = setTimeout(() => {
      // 发送error
      this.emit('data', {
        error: 'time out',
      });
    }, 1000 * 10);
  }

  private grpcCallBack( // eslint-disable-line complexity
    res: StreamingTranslationResponse,
    err: Error,
  ) {
    // 收到返回数据，清楚超时定时器
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    if (res) {
      try {
        const result = res.toObject();
        this.emit('data', {
          result,
        });
      } catch (error) {
        this.emit('data', {
          error,
        });
      }
    } else if (err) {
      this.emit('data', {
        error: err,
      });
    }
  }

  private streamError(error: Error) {
    this.emit('data', {
      error,
    });
  }

  private getAudioChannel(audioInfo?: IAudioStream): number {
    if (!audioInfo || !audioInfo.channels) return 0;
    // 5.1 ac3/eac3/aac/dts 左前、右前、中置、左后、右后、重低音
    if (audioInfo.channels === 6
      && (audioInfo.codecName === 'ac3'
        || audioInfo.codecName === 'eac3'
        || audioInfo.codecName === 'aac'
        || audioInfo.codecName === 'dts')) return 6;
    // 6.1 truehd 左前、右前、前中置、左后、右后、后中置、重低音
    // if (audioInfo.channels === 7
    //   && (audioInfo.codecName === 'truehd')) return 4;
    // 7.1 dts 左前、右前、中置、左中、右中、左后、右后、重低音
    if (audioInfo.channels === 8
      && (audioInfo.codecName === 'dts')) return 3;
    // if (audioInfo.channels === 8
    //   && (audioInfo.codecName === 'truehd')) return 4;
    return 0;
  }

  public next() {
    this.pts = '0';
    this.grabTime = 0;
    this.status = 0;
    this.audioChannel = this.getAudioChannel(this.audioInfo);
    this.grabAudio();
    this.streamClient.once('data', this.grpcCallBack.bind(this));
  }

  public stop() {
    this.pts = '0';
    this.status = 1;
    splayerx.stopGrabAudioFrame();
    if (this.streamClient) {
      this.streamClient.removeAllListeners();
      this.streamClient.once('error', () => {
        // TODO log error
      });
      this.streamClient = null;
    }
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
  }
}

export const audioGrabService = new AudioGrabService();
