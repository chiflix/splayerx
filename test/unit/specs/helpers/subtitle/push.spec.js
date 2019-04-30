import { createSandbox, match } from 'sinon';
import PQueue from 'p-queue';

import transcriptQueue, { TranscriptQueue, __RewireAPI__ as pushRewireAPI } from '@/helpers/subtitle/push';
import { randStr } from '../../../helpers';

describe('helper - subtitle - push', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('class - TranscriptQueue', () => {
    describe('constructor', () => {
      it('should be provided with a PQueue instance', () => {
        expect(() => new TranscriptQueue()).throws();
        expect(() => new TranscriptQueue(new PQueue())).to.not.throws();
      });
    });
    let testPQueue;
    let testTQueue;
    beforeEach(() => {
      testPQueue = new PQueue();
      testTQueue = new TranscriptQueue(testPQueue);
    });
    describe('method - add', () => {
      let testSubtitle;
      let testSubtitleId;
      let addStub;
      let pushTranscriptStub;
      beforeEach(() => {
        testSubtitle = {
          src: randStr(),
          mediaIdentity: randStr(),
          languageCode: 'zh-CN',
          format: 'ass',
          playedTime: 20,
          totalTime: 200,
          delay: 0,
        };
        testSubtitleId = `${testSubtitle.src}-${testSubtitle.mediaIdentity}`;
        testPQueue = new PQueue();
        addStub = sandbox.stub(testPQueue, 'add').callsArg(0);
        testTQueue = new TranscriptQueue(testPQueue);

        pushTranscriptStub = sandbox.stub().resolves();
        pushRewireAPI.__Rewire__('Sagi', { pushTranscript: pushTranscriptStub });
      });
      afterEach(() => {
        pushRewireAPI.__ResetDependency__('Sagi');
      });

      it('should resolves false when adding invalid subtitle', (done) => {
        testTQueue.add({})
          .then((result) => {
            expect(result).to.be.false;
            done();
          })
          .catch(done);
      });
      it('should invoke pQueue.add and Sagi.pushTranscript when adding subtitle', (done) => {
        testTQueue.add(testSubtitle)
          .then(() => {
            expect(addStub).to.have.been.called;
            expect(pushTranscriptStub).to.have.been.calledWithExactly(testSubtitle);
            done();
          }).catch(done);
      });
      it('should subtitle be added when the successful same does not exist', (done) => {
        testTQueue.add(testSubtitle)
          .then(() => {
            expect(addStub).to.have.been.called;
            done();
          }).catch(done);
      });
      it('should subtitle be added with higher priority when the same failed exists', (done) => {
        testTQueue.subtitleState[testSubtitleId] = 'failed';
        testTQueue.add(testSubtitle)
          .then(() => {
            expect(addStub).to.have.been.calledWithMatch(match.any, { priority: 1 });
            done();
          }).catch(done);
      });
      it('should subtitle be added no matter what when adding manually', (done) => {
        testTQueue.subtitleState[testSubtitleId] = 'loading';
        testTQueue.add(testSubtitle, true)
          .then(() => {
            expect(addStub).to.have.been.called;
            done();
          }).catch(done);
      });
      it('should subtitle be ignored when the successful same exists', (done) => {
        testTQueue.subtitleState[testSubtitleId] = 'successful';
        testTQueue.add(testSubtitle)
          .then(() => {
            expect(addStub).to.have.not.been.called;
            done();
          }).catch(done);
      });
      it('should subtitle be ignored when the loading same exists', (done) => {
        testTQueue.subtitleState[testSubtitleId] = 'loading';
        testTQueue.add(testSubtitle)
          .then(() => {
            expect(addStub).to.have.not.been.called;
            done();
          }).catch(done);
      });
      it('should update subtitle to loading when adding subtitle', () => {
        testTQueue.add(testSubtitle);
        expect(testTQueue.subtitleState).to.have.property(testSubtitleId, 'loading');
      });
      it('should update subtitle to successful when adding subtitle succeeds', (done) => {
        testTQueue.add(testSubtitle)
          .then(() => {
            expect(testTQueue.subtitleState).to.have.property(testSubtitleId, 'successful');
            done();
          }).catch(done);
      });
      it('should update subtitle to failed when adding subtitle fails', (done) => {
        addStub.rejects();
        testTQueue.add(testSubtitle)
          .then(() => {
            expect(testTQueue.subtitleState).to.have.property(testSubtitleId, 'failed');
            done();
          }).catch(done);
      });
      it('should resolve true when adding subtitle succeeds', (done) => {
        testTQueue.add(testSubtitle)
          .then((result) => {
            expect(result).to.be.true;
            done();
          }).catch(done);
      });
      it('should resolve false when adding subtitle fails', (done) => {
        addStub.rejects();
        testTQueue.add(testSubtitle)
          .then((result) => {
            expect(result).to.be.false;
            done();
          }).catch(done);
      });
    });
    describe('method - addAll', () => {
      const generateTestSubtitles = (count) => {
        const subtitles = [];
        for (let i = 1; i <= count; i += 1) {
          subtitles.push({
            src: randStr(),
            mediaIdentity: randStr(),
          });
        }
        return subtitles;
      };
      let addStub;
      beforeEach(() => {
        addStub = sandbox.stub(testTQueue, 'add').resolves(true);
      });
      it('should invoke add multiple times', (done) => {
        const times = 10;
        const subtitles = generateTestSubtitles(10);
        testTQueue.addAll(subtitles)
          .then(() => {
            expect(addStub.callCount).to.equal(times);
            done();
          }).catch(done);
      });
      it('should resolves with the successful ones and failed ones', (done) => {
        const [failedSubtitle1, failedSubtitle2] = generateTestSubtitles(2);
        addStub.withArgs(failedSubtitle1).resolves(false);
        addStub.withArgs(failedSubtitle2).resolves(false);
        const successfulSubtitles = generateTestSubtitles(3);
        testTQueue.addAll([...successfulSubtitles, failedSubtitle1, failedSubtitle2])
          .then(({ success, failure }) => {
            expect(success).to.deep.equal(successfulSubtitles);
            expect(failure).to.deep.equal([failedSubtitle1, failedSubtitle2]);
            done();
          }).catch(done);
      });
    });
  });
  describe('instance - transcriptQueue', () => {
    it('should transcriptQueue be an instance of TranscriptQueue', () => {
      expect(transcriptQueue).to.be.an.instanceOf(TranscriptQueue);
    });
  });
});
