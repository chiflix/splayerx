/*
 * @Author: tanghaixiang@xindong.com 
 * @Date: 2019-06-20 18:03:14 
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-06-21 10:19:24
 */

// @ts-ignore
import { splayerx, ipcRenderer } from 'electron';
import path from 'path';
import fs from 'fs';
import { StreamingTrainingRequest } from 'sagi-api/training/v1/training_pb';
import { TrainngClient } from 'sagi-api/training/v1/training_grpc_pb';

/* eslint-disable */
const grpc = require('grpc');
/* eslint-enable */
var endpoint: string = '';
if (process.env.NODE_ENV === 'production') {
  endpoint = 'apis.sagittarius.ai:8443';
} else {
  endpoint = 'apis.stage.sagittarius.ai:8443';
}

type JobData = {
  mediaHash: string,
  videoSrc: string,
  languageCode: string,
}

export default class AudioGrabService {
  mediaHash: string = '';
  videoSrc: string = '';
  pts: string = '0';
  audioChannel: number = 1;
  rate: number = 16000;
  languageCode: string = '';
  streamClint: any = null;
  request: any = null;
  queue: [JobData];

  constructor() {
  }

  private grabAudio() {
    const {
      videoSrc, pts, audioChannel, rate, handleCallBack,
    } = this;
    splayerx.grabAudioFrame(
      videoSrc, // 需要提取音频的视频文件路径
      `${pts}`, // seek位置
      0, // 需要提取的声道, [1,8] 0代表提取所有声道
      audioChannel, // 重采样的声道[1,8] 1代表单声道
      rate, // 采样频率
      1, // 采样存储格式 0 代表 AV_SAMPLE_FMT_U8
      handleCallBack,
    );
  }

  private handleCallBack(err: string, framebuf: Buffer, framedata: string) {
    if (err !== 'EOF' && framedata && framebuf) {
      const s = framedata.split(',');
      this.pts = s[0];
      this.request.clearStreamingConfig();
      this.request.clearAudioContent();
      this.request.setAudioContent(framebuf);
      this.streamClint.write(this.request);
      setImmediate(() => {
        this.grabAudio();
      });
    } else if (err === 'EOF') {
      this.request.clearAudioContent();
      this.request.setAudioContent(framebuf);
      this.streamClint.write(this.request);
      this.streamClint.end();
      this.streamClint = null;
      this.request = null;
    } else {
      console.error(err);
      setTimeout(() => {
        this.grabAudio();
      }, 50);
    }
  }

  public send(data: JobData) {
    ipcRenderer.send('grab-audio', data);
  }

  public push(data: JobData) {
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
    this.languageCode = data.languageCode;
    // create stream client
    this.streamClint = this.openClient();

    // send config
    this.request = new StreamingTrainingRequest();
    this.request.setMediaIdentity(data.mediaHash);
    // @ts-ignore
    const c = new global.proto.google.cloud.speech.v1.RecognitionConfig([1, this.rate, this.languageCode]);
    this.request.setStreamingConfig(c);
    this.streamClint.write(this.request);

    // start grab data
    this.pts = '0';
    this.grabAudio();
  }

  private openClient(): any {
    const sslCreds = grpc.credentials.createSsl(
      // @ts-ignore
      fs.readFileSync(path.join(__static, '/certs/ca.pem')),
      // @ts-ignore
      fs.readFileSync(path.join(__static, '/certs/key.pem')),
      // @ts-ignore
      fs.readFileSync(path.join(__static, '/certs/cert.pem')),
    );
    const metadataUpdater = (_: any, cb: Function) => {
      const metadata = new grpc.Metadata();
      cb(null, metadata);
    };
    const metadataCreds = grpc.credentials.createFromMetadataGenerator(metadataUpdater);
    const combinedCreds = grpc.credentials.combineChannelCredentials(sslCreds, metadataCreds);
    const client = new TrainngClient(endpoint, combinedCreds);
    const stream = client.streamingTraining(this.rpcCallBack);
    return stream;
  }

  private rpcCallBack(res: any, err: Error) {
    console.log(res);
    if (res && this.queue.length > 0) {
      const job = this.queue.shift();
      if (job) {
        this.startJob(job);
      }
    }
  }
}

export const audioGrabService = new AudioGrabService();
