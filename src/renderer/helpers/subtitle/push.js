import PQueue from 'p-queue';
import Sagi from '@/libs/sagi';

const validProperties = [
  'mediaIdentity',
  'format',
  'playedTime',
  'totalTime',
  'delay',
];
function checkProperty(object) {
  return validProperties.every((property) => {
    const value = object[property];
    return value !== undefined && value !== null;
  });
}

export class TranscriptQueue {
  queue = new PQueue();

  constructor(pqueueInstance) {
    if ((pqueueInstance instanceof PQueue)) {
      this.queue = pqueueInstance;
    } else throw new TypeError('Expected PQueue instance provided.');
  }

  subtitleState = {};

  async add(subtitle, isManual) {
    if (checkProperty(subtitle)) {
      const id = `${subtitle.src}-${subtitle.mediaIdentity}`;
      const options = { priority: 0 };
      if (!isManual) {
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
      }
      return this.queue.add(() => Sagi.pushTranscript(subtitle), options)
        .then(() => {
          this.subtitleState[id] = 'successful';
          return true;
        })
        .catch(() => {
          this.subtitleState[id] = 'failed';
          return false;
        });
    }
    return false;
  }

  async addAll(subtitles) {
    const success = [];
    const failure = [];
    const addSubtitle = async (subtitle) => {
      const result = await this.add(subtitle);
      if (result) success.push(subtitle);
      else failure.push(subtitle);
    };

    await Promise.all(subtitles.map(addSubtitle));

    return { success, failure };
  }

  async addAllManual(subtitles) {
    const success = [];
    const failure = [];
    const addSubtitle = async (subtitle) => {
      const result = await this.add(subtitle);
      if (result) success.push(subtitle);
      else failure.push(subtitle);
    };

    await Promise.all(subtitles.map(i => addSubtitle(i, true)));

    return { success, failure };
  }
}
export default new TranscriptQueue(new PQueue());
