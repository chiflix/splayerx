/*
 * @Author: tanghaixiang@xindong.com
 * @Date: 2019-07-22 17:18:34
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-07-24 12:12:36
 */

import { EventEmitter } from 'events';
// @ts-ignore
import { splayerx } from 'electron';
import { isNaN } from 'lodash';

type JobData = {
  videoSrc: string,
  audioId: number,
}

export default class AudioGrabService extends EventEmitter {
  private videoSrc: string;

  private audioId: number;

  private pts: string;

  private audioChannel: number;

  private rate: number = 16000;

  private _count: number;

  private grabTime: number;

  private queue: [JobData];

  private status: number; // 0 grab, 1 stop

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

  private startJob(data: JobData) {
    this.videoSrc = data.videoSrc;
    const audioId = Number(data.audioId);
    this.audioId = isNaN(audioId) ? -1 : audioId;
    this.pts = '0';
    this._count = 0;
    this.grabTime = 0;
    this.status = 0;
    this.audioChannel = 0;
    this.grabAudio();
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
      this._count += 1;
      const s = framedata.split(',');
      this.pts = s[0];
      this.grabTime += (Number(s[3]) / this.rate);
      this.emit('data', framebuf, false, this.grabTime);
    } else if (err === 'EOF') {
      this._count += 1;
      this.emit('data', framebuf, true);
    } else {
      // TODO 处理grabAudioFrame error ，有些视频直接不能，就返回error
      setTimeout(() => {
        this.grabAudio();
      }, 20);
    }
  }

  public next() {
    // empty
    this.grabAudio();
  }

  public stop() {
    this.pts = '0';
    this.status = 1;
    splayerx.stopGrabAudioFrame();
  }
}

export const audioGrabService = new AudioGrabService();
