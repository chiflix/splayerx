/*
 * @Author: tanghaixiang@xindong.com
 * @Date: 2019-06-20 18:03:14
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-06-28 17:29:08
 */

import { splayerx } from 'electron';
import path from 'path';
import fs from 'fs';
import { StreamingTranslationRequest, StreamingTranslationRequestConfig } from 'sagi-api/translation/v1/translation_pb';
import { TranslationClient } from 'sagi-api/translation/v1/translation_grpc_pb';

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
    this.streamClient = null;
    this.request = null;
    this.queue = [];
    this.callback = null;
  }

  grabAudio() {
    const {
      videoSrc, pts, audioChannel, rate, handleCallBack,
    } = this;
    splayerx.grabAudioFrame(
      videoSrc, // 需要提取音频的视频文件路径
      `${pts}`, // seek位置
      -1, // 音轨
      0, // 需要提取的声道, [1,8] 0代表提取所有声道
      audioChannel, // 重采样的声道[1,8] 1代表单声道
      rate, // 采样频率
      1, // 采样存储格式 0 代表 AV_SAMPLE_FMT_U8
      200, // 一次性待提取的帧数
      handleCallBack.bind(this),
    );
  }

  handleCallBack(err, framebuf, framedata) {
    if (err !== 'EOF' && framedata && framebuf) {
      const s = framedata.split(',');
      // console.log(`${this.pts},-1,0,${this.audioChannel},${this.rate},1,200 --send
      // ${framedata} -- back
      // ${err} -- error`);
      this.pts = s[0];
      this.request.clearStreamingConfig();
      this.request.clearAudioContent();
      this.request.setAudioContent(framebuf);
      this.streamClient.write(this.request);
      // setImmediate(() => {
      //   this.grabAudio();
      // });
      setTimeout(() => {
        this.grabAudio();
      }, 0);
    } else if (err === 'EOF') {
      this.request.clearAudioContent();
      this.request.setAudioContent(framebuf);
      this.streamClient.write(this.request);
      this.streamClient.end();
      // this.streamClient = null;
      // this.request = null;
      console.warn('EOF');
      this.callback();
    } else {
      console.error(err);
      // 如果不延迟处理，就会卡住
      setTimeout(() => {
        this.grabAudio();
      }, 20);
    }
  }

  push(data, callback) {
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

  startJob(data) {
    this.mediaHash = data.mediaHash;
    this.videoSrc = data.videoSrc;
    this.languageCode = data.languageCode;
    this.callback = data.callback;
    // create stream client
    this.streamClient = this.openClient();

    // send config
    this.request = new StreamingTranslationRequest();
    const cc = new StreamingTranslationRequestConfig();
    const c = new global.proto.google.cloud.speech.v1
      .RecognitionConfig([1, this.rate, this.languageCode]);
    cc.setStreamingConfig(c);
    cc.setAudioLanguageCode(this.languageCode);
    cc.setTargetLanguageCode(this.languageCode);
    cc.setMediaIdentity(data.mediaHash);
    this.request.setStreamingConfig(cc);
    this.streamClient.write(this.request);
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
    const client = new TranslationClient(endpoint, combinedCreds);
    const stream = client.streamingTranslation();
    stream.on('data', this.rpcDataCallBack.bind(this));
    stream.on('end', this.rpcCallBack.bind(this));
    // stream.write()
    return stream;
  }

  rpcDataCallBack(res, err) {
    const s = this.videoSrc;
    console.log('data', res, err);
    // if (res && this.queue.length > 0) {
    //   const job = this.queue.shift();
    //   if (job) {
    //     this.startJob(job);
    //   }
    // }
  }

  rpcCallBack(res, err) {
    const s = this.videoSrc;
    console.log('end', res, err);
    // if (res && this.queue.length > 0) {
    //   const job = this.queue.shift();
    //   if (job) {
    //     this.startJob(job);
    //   }
    // }
  }
}

export const audioHandler = new AudioHandler();
