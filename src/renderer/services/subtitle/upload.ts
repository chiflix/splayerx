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
    const options = { priority: 0 } as { priority: 0 | 1 };
    if (this.subtitleState[id] === 'loading') return false;
    if (this.subtitleState[id] === 'failed') options.priority = 1;
    this.subtitleState[id] = 'loading';
    return this.addManually(subtitle, options);
  }

  async addManually(subtitle: SubtitleUploadParameter, options: { priority : 0 | 1 } = { priority: 0 }) {
    const id = `${subtitle.hints}-${subtitle.mediaIdentity}`;
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
