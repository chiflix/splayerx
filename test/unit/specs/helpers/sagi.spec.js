import { createSandbox } from 'sinon';
import Sagi from '@/helpers/sagi';

describe('helper.sagi api', () => {
  let sandbox;
  let randomMediaIdentity;

  function generateMediaHash() {
    const randStr = () => Math.random().toString(36).substring(7);
    return `${randStr()}-${randStr()}-${randStr()}-${randStr()}`;
  }

  // NOTE&TODO: to test raw functions, coresponding client and data need mocking

  beforeEach(() => {
    sandbox = createSandbox();
    randomMediaIdentity = generateMediaHash();
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
    it('should mediaTranslate invoke mediaTranslateRaw', () => {
      const mediaTranslateRawSpy = sandbox.spy(Sagi, 'mediaTranslateRaw');

      Sagi.mediaTranslate({ mediaIdentity: randomMediaIdentity });

      sandbox.assert.calledWithExactly(mediaTranslateRawSpy, randomMediaIdentity, 'zh');
    });

    // TODO: error handling tests
  });

  describe('getTranscript unit tests', () => {
    it('should getTranscript invoke getTranscriptRaw', () => {
      const getTranscriptRawSpy = sandbox.spy(Sagi, 'getTranscriptRaw');

      Sagi.getTranscript({ transcriptIdentity: randomMediaIdentity });

      sandbox.assert.calledWithExactly(getTranscriptRawSpy, randomMediaIdentity);
    });

    // TODO: error handling tests
  });

  describe('pushTranscript unit tests', () => {
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
      sampleText = `this is a playload sample ${randomMediaIdentity}`;
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

      sandbox.assert.calledWithExactly(
        pushTranscriptRawWithPayloadSpy,
        transcriptData.mediaIdentity,
        transcriptData.languageCode,
        transcriptData.format,
        transcriptData.playedTime,
        transcriptData.totalTime,
        transcriptData.delay,
        samplePayload,
      );
    });

    it('should transcriptData with only transcriptIdentity invoke pushTranscriptRawWithTranscriptIdentity', () => {
      const pushTransctiptRawWithTranscriptSpy = sandbox.spy(Sagi, 'pushTranscriptRawWithTranscriptIdentity');

      Sagi.pushTranscript({ ...transcriptData, transcriptIdentity: randomMediaIdentity });

      sandbox.assert.calledWithExactly(
        pushTransctiptRawWithTranscriptSpy,
        transcriptData.mediaIdentity,
        transcriptData.languageCode,
        transcriptData.format,
        transcriptData.playedTime,
        transcriptData.totalTime,
        transcriptData.delay,
        randomMediaIdentity,
      );
    });

    it('should transcriptData with payload and transcriptIdentity invoke pushTranscriptRawWithPayload', () => {
      const pushTranscriptRawWithPayloadSpy = sandbox.spy(Sagi, 'pushTranscriptRawWithPayload');
      const pushTransctiptRawWithTranscriptSpy = sandbox.spy(Sagi, 'pushTranscriptRawWithTranscriptIdentity');

      Sagi.pushTranscript({
        ...transcriptData,
        payload: samplePayload,
        transcriptIdentity: randomMediaIdentity,
      });

      sandbox.assert.calledWithExactly(
        pushTranscriptRawWithPayloadSpy,
        transcriptData.mediaIdentity,
        transcriptData.languageCode,
        transcriptData.format,
        transcriptData.playedTime,
        transcriptData.totalTime,
        transcriptData.delay,
        samplePayload,
      );
      sandbox.assert.notCalled(pushTransctiptRawWithTranscriptSpy);
    });

    // TODO: error handling tests
  });
});
