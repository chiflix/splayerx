import PQueue from 'p-queue';

export default class ProceduralQueue {
  queue = new PQueue();

  constructor(options) {
    const finalOptions = { concurrency: 1 };
    if (options && !options.autoStart) finalOptions.autoStart = false;
    this.queue = new PQueue(finalOptions);
  }

  add(task) {
    return this.queue.add(task);
  }

  start() {
    this.queue.start();
  }
}
