import { createSandbox } from 'sinon';
import PQueue from 'p-queue';

import transcriptQueue, { TranscriptQueue } from '@/helpers/subtitle/push';

describe('helper - subtitle - push', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('class - TranscriptQueue', () => {
    describe.only('constructor', () => {
      it('should be provided with a PQueue instance', () => {
        expect(() => new TranscriptQueue()).throws();
        expect(() => new TranscriptQueue(new PQueue())).to.not.throws();
      });
    });
    describe('method - add', () => {
      it('should subtitle be added when the successful same does not exist');
      it('should subtitle be added with higher priority when the same failed exists');
      it('should subtitle be ignored when the successful same exists');
      it('should invoke pQueue.add when adding subtitle');
      it('should update subtitle to loading when adding subtitle');
      it('should update subtitle to successful when adding subtitle succeeds');
      it('should update subtitle to failed when adding subtitle fails');
      it('should resolve when adding subtitle succeeds');
      it('should reject when adding subtitle fails');
    });
    describe('method - addAll', () => {
      it('should invoke add');
      it('should resolves with the successful and failed transcriptIdentities');
    });
  });
  describe.only('instance - transcriptQueue', () => {
    it('should transcriptQueue be an instance of TranscriptQueue', () => {
      expect(transcriptQueue).to.be.an.instanceOf(TranscriptQueue);
    });
  });
});
