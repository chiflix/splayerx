import { createSandbox, assert } from 'sinon';
import flatMap from 'lodash/flatMap';
import Sagi from '@/helpers/sagi';

describe('helper.sagi api', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  it('sagi.healthCheck should be 1', (done) => {
    Sagi.healthCheck().then((status) => {
      expect(status).to.equal(1);
      done();
    }).catch((reason) => {
      // fail the test
      done(reason);
    });
  }).timeout(20000);

  describe('mediaTranslate unit tests', () => {
    const mediaIdentity = '11-22-33-44';
    it('should proper mediaIdentity return OK when not in production', (done) => {
      if (process.env.NODE_ENV !== 'production') {
        Sagi.mediaTranslate({ mediaIdentity }).then(({ length }) => {
          expect(length, 'results list length').to.be.above(0);
          done();
        });
      }
      done();
    });

    it('should proper mediaIdentity return error when in production', (done) => {
      if (process.env.NODE_ENV === 'production') {
        Sagi.mediaTranslate({ mediaIdentity }).catch(({ code }) => {
          expect(code, 'error').to.equal(5); // no result
          done();
        });
      }
      done();
    });
  }).timeout(20000);

  describe('pushTranscript unit tests', () => {
    function randstr() {
      return Math.random().toString(36).substring(7);
    }
    let randomMediaIdentity;
    let sampleText;
    let samplePayload;
    const baseTranscriptData = {
      languageCode: 'zh',
      format: 'srt',
      playedTime: 80,
      totalTime: 100,
      delay: 0,
    };
    let transcriptData;

    beforeEach(() => {
      randomMediaIdentity = `${randstr()}-${randstr()}-${randstr()}-${randstr()}`;
      sampleText = `this is a playload sample ${randstr()}`;
      samplePayload = Buffer.from(`
        1
        00:00:00,440 --> 00:02:20,375
        ${sampleText}
      `);
      transcriptData = {
        ...baseTranscriptData,
        mediaIdentity: randomMediaIdentity,
      };
    });

    it('should transcriptData with only payload invoke pushTranscriptRawWithPayload', () => {
      const pushTranscriptRawWithPayloadSpy = sandbox.spy(Sagi, 'pushTranscriptRawWithPayload');

      Sagi.pushTranscript({ ...transcriptData, payload: samplePayload });

      assert.calledOnce(pushTranscriptRawWithPayloadSpy);
    });

    it('should transcriptData with only transcriptIdentity invoke pushTranscriptRawWithTranscriptIdentity', () => {
      const pushTransctiptRawWithTranscriptSpy = sandbox.spy(Sagi, 'pushTranscriptRawWithTranscriptIdentity');

      Sagi.pushTranscript({ ...transcriptData, transcriptIdentity: randomMediaIdentity });

      assert.calledOnce(pushTransctiptRawWithTranscriptSpy);
    });

    it('should transcriptData with payload and transcriptIdentity invoke pushTranscriptRawWithPayload', () => {
      const pushTranscriptRawWithPayloadSpy = sandbox.spy(Sagi, 'pushTranscriptRawWithPayload');
      const pushTransctiptRawWithTranscriptSpy = sandbox.spy(Sagi, 'pushTranscriptRawWithTranscriptIdentity');

      Sagi.pushTranscript({
        ...transcriptData,
        payload: samplePayload,
        transcriptIdentity: randomMediaIdentity,
      });

      assert.calledOnce(pushTranscriptRawWithPayloadSpy);
      assert.notCalled(pushTransctiptRawWithTranscriptSpy);
    });

    it('should be able to pushTranscript', (done) => {
      Sagi.pushTranscript({ ...transcriptData, payload: samplePayload })
        .then((res) => {
          expect(res.code).to.equal(0);
          done();
        })
        .catch(err => done(err));
    });

    it('should be able to get the transcript just pushed', (done) => {
      Sagi.pushTranscript({ ...transcriptData, payload: samplePayload })
        .then((err) => {
          expect(transcriptData.mediaIdentity).to.equal(randomMediaIdentity);
          if (!err.code) {
            return Sagi.mediaTranslate({
              mediaIdentity: randomMediaIdentity,
              languageCode: 'en',
            });
          }
          throw (err);
        })
        .then((transcriptsList) => {
          expect(transcriptsList.length).to.above(0);
          return Promise.all(transcriptsList
            .map(({ transcriptIdentity }) => Sagi.getTranscript({ transcriptIdentity }))
          );
        })
        .then((transcripts) => {
          const realTranscripts = flatMap(transcripts);
          expect(realTranscripts.length).to.above(0);
          expect(realTranscripts.map(({ text }) => text.toLowerCase())).to.includes(sampleText);
          done();
        })
        .catch((err) => {
          console.error(err);
          done(`Failed to fetch transcripts for mediaHash ${randomMediaIdentity}.`)
        });
    });
  });
});
