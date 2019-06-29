// @ts-ignore
import PQueue from 'p-queue';
import Sagi from '@/libs/sagi';
import { TrainingData } from 'sagi-api/training/v1/training_pb';

export type SubtitleUploadParameter = TrainingData.AsObject;

export class TranscriptQueue {
  queue = new PQueue();

  constructor(pqueueInstance: PQueue) {
    if ((pqueueInstance instanceof PQueue)) {
      this.queue = pqueueInstance;
    } else throw new TypeError('Expected PQueue instance provided.');
  }

  subtitleState = {};

  async add(subtitle: SubtitleUploadParameter) {
    const id = `${subtitle.hints}-${subtitle.mediaIdentity}`;
    const options = { priority: 0 };
    switch (this.subtitleState[id]) {
      default:
        this.subtitleState[id] = 'loading';
        break;
      case 'failed':
        this.subtitleState[id] = 'loading';
        options.priority = 1;
        break;
      case 'loading':
      case 'successful':
        return false;
    }
    return this.addManually(subtitle);
  }

  async addManually(subtitle: SubtitleUploadParameter) {
    const id = `${subtitle.hints}-${subtitle.mediaIdentity}`;
    const options = { priority: 0 };
    const task = subtitle.transcriptIdentity ?
      () => Sagi.pushTranscriptWithTranscriptIdentity(subtitle) :
      () => Sagi.pushTranscriptWithPayload(subtitle);
    return this.queue.add(task, options)
        .then(() => {
          this.subtitleState[id] = 'successful';
          return true;
        })
        .catch(() => {
          this.subtitleState[id] = 'failed';
          return false;
        });
  }

  async addAll(subtitles: SubtitleUploadParameter[]) {
    const success: SubtitleUploadParameter[] = [];
    const failure: SubtitleUploadParameter[] = [];
    const addSubtitle = async (subtitle: SubtitleUploadParameter) => {
      const result = await this.add(subtitle);
      if (result) success.push(subtitle);
      else failure.push(subtitle);
    };

    await Promise.all(subtitles.map(addSubtitle));

    return { success, failure };
  }

  async addAllManual(subtitles: SubtitleUploadParameter[]) {
    const success: SubtitleUploadParameter[] = [];
    const failure: SubtitleUploadParameter[] = [];
    const addSubtitle = async (subtitle: SubtitleUploadParameter) => {
      const result = await this.addManually(subtitle);
      if (result) success.push(subtitle);
      else failure.push(subtitle);
    };

    await Promise.all(subtitles.map(i => addSubtitle(i)));

    return { success, failure };
  }
}
export default new TranscriptQueue(new PQueue());
