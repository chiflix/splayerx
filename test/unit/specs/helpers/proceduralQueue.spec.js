import { createSandbox } from 'sinon';

import ProceduralQueue from '@/helpers/proceduralQueue';
import { randStr } from '../../helpers';

describe('helper - proceduralQueue', () => {
  let sandbox = createSandbox();
  function generateTask(param, shouldReject) {
    return () => new Promise((resolve, reject) => {
      console.log(param);
      if (shouldReject) reject(param);
      resolve(param);
    });
  }
  let testQueue;
  let testParam;
  let testTask;
  let logStub;
  beforeEach(() => {
    sandbox = createSandbox();
    testParam = randStr();
    testTask = generateTask(testParam);
    logStub = sandbox.stub(console, 'log');
  });
  afterEach(() => {
    sandbox.restore();
  });
  it('should task be executed immediately if autoStart', () => {
    testQueue = new ProceduralQueue({ autoStart: true });
    testQueue.add(testTask);

    expect(logStub).to.have.been.calledWith(testParam);
  });
  it('should task be executed only when start if not autoStart', () => {
    testQueue = new ProceduralQueue({ autoStart: false });
    testQueue.add(testTask);

    expect(logStub).to.have.not.been.calledWith(testParam);
    testQueue.start();
    expect(logStub).to.have.been.calledWith(testParam);
  });
  it('should return a promise that resolves when task resolves', (done) => {
    testQueue = new ProceduralQueue();
    const testPromise = testQueue.add(testTask);

    testPromise.then((result) => {
      expect(result).to.equal(testParam);
      done();
    }).catch(done);
  });
  it('should return a promise that rejects when task rejects', (done) => {
    testQueue = new ProceduralQueue();
    testTask = generateTask(testParam, true);
    const testPromise = testQueue.add(testTask);

    testPromise.catch((result) => {
      expect(result).to.equal(testParam);
      done();
    }).then(() => done('Should reject but it resolves.'));
  });
  it('should tasks be executed in order of adding', (done) => {
    const testObject = {};
    testObject.param1 = randStr();
    testObject.param2 = randStr();
    const testTask1 = () => generateTask(testObject.param1)()
      .then((result) => { testObject.testParam2 = result; });
    const testTask2 = () => console.log(testObject.testParam2);
    testQueue = new ProceduralQueue();

    testQueue.add(testTask1);
    testQueue.add(testTask2).then(() => {
      expect(logStub).to.have.been.always.calledWithExactly(testObject.param1);
      done();
    }).catch(done);
  });
});
