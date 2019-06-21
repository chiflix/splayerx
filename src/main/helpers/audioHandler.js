/*
 * @Author: tanghaixiang@xindong.com
 * @Date: 2019-06-20 18:03:14
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-06-21 10:17:52
 */

import { splayerx } from 'electron';
import path from 'path';
import fs from 'fs';
import { StreamingTrainingRequest } from 'sagi-api/training/v1/training_pb';
import { TrainngClient } from 'sagi-api/training/v1/training_grpc_pb';

/* eslint-disable */
const grpc = require('grpc');
/* eslint-enable */
let endpoint = '';
if (process.env.NODE_ENV === 'production') {
  endpoint = 'apis.sagittarius.ai:8443';
} else {
  endpoint = 'apis.stage.sagittarius.ai:8443';
}

export default class AudioHandler {
  constructor() {
    this.mediaHash = '';
    this.videoSrc = '';
    this.pts = '0';
    this.audioChannel = 1;
    this.rate = 16000;
    this.languageCode = '';
    this.streamClint = null;
    this.request = null;
    this.queue = [];
  }

  grabAudio() {
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
      handleCallBack.bind(this),
    );
  }

  handleCallBack(err, framebuf, framedata) {
    if (err !== 'EOF' && framedata && framebuf) {
      const s = framedata.split(',');
      console.log(framedata);
      this.pts = s[0];
      this.request.clearStreamingConfig();
      this.request.clearAudioContent();
      this.request.setAudioContent(framebuf);
      this.streamClint.write(this.request);
      // setImmediate(() => {
      //   this.grabAudio();
      // });
      setTimeout(() => {
        this.grabAudio();
      }, 0);
    } else if (err === 'EOF') {
      this.request.clearAudioContent();
      this.request.setAudioContent(framebuf);
      this.streamClint.write(this.request);
      this.streamClint.end();
      this.streamClint = null;
      this.request = null;
    } else {
      console.error(err);
      // 如果不延迟处理，就会卡住
      // setTimeout(() => {
      //   this.grabAudio();
      // }, 50);
    }
  }

  push(data) {
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

  startJob(data) {
    this.mediaHash = data.mediaHash;
    this.videoSrc = data.videoSrc;
    this.languageCode = data.languageCode;
    // create stream client
    this.streamClint = this.openClient();

    // send config
    this.request = new StreamingTrainingRequest();
    this.request.setMediaIdentity(data.mediaHash);
    const c = new global.proto.google.cloud.speech.v1
      .RecognitionConfig([1, this.rate, this.languageCode]);
    this.request.setStreamingConfig(c);
    this.streamClint.write(this.request);

    // start grab data
    this.pts = '0';
    this.grabAudio();
  }

  openClient() {
    const sslCreds = grpc.credentials.createSsl(
      fs.readFileSync(path.join(__static, '/certs/ca.pem')),
      fs.readFileSync(path.join(__static, '/certs/key.pem')),
      fs.readFileSync(path.join(__static, '/certs/cert.pem')),
    );
    const metadataUpdater = (_, cb) => {
      const metadata = new grpc.Metadata();
      cb(null, metadata);
    };
    const metadataCreds = grpc.credentials.createFromMetadataGenerator(metadataUpdater);
    const combinedCreds = grpc.credentials.combineChannelCredentials(sslCreds, metadataCreds);
    const client = new TrainngClient(endpoint, combinedCreds);
    const stream = client.streamingTraining(this.rpcCallBack);
    return stream;
  }

  rpcCallBack(res, err) {
    console.log(res, err);
    if (res && this.queue.length > 0) {
      const job = this.queue.shift();
      if (job) {
        this.startJob(job);
      }
    }
  }
}

export const audioHandler = new AudioHandler();
