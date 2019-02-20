import PQueue from 'p-queue';

export class TranscriptQueue {
  #queue = new PQueue();
  constructor(pqueueInstance) {
    if ((pqueueInstance instanceof PQueue)) {
      this.queue = pqueueInstance;
    } else throw new TypeError('Expected PQueue instance provided.');
  }
}
export default new TranscriptQueue(new PQueue());
