import SubtitleLoader, { __RewireAPI__ as subtitleLoaderRewireAPI } from '@/components/Subtitle/SubtitleLoader';
import { SubtitleError, ErrorCodes } from '@/components/Subtitle/SubtitleLoader/errors';
import sinon from 'sinon';
import EventEmitter from 'events';
import { randStr } from '../../../helpers';

describe('SubtitleLoader unit tests', () => {
  let sandbox;
  let loader;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    loader = new SubtitleLoader('', 'online');
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('SubtitleLoader constructor test', () => {
    let storeSubtitleStub;
    beforeEach(() => {
      storeSubtitleStub = sandbox.stub().resolves();
      subtitleLoaderRewireAPI.__Rewire__('storeSubtitle', storeSubtitleStub);
    });
    afterEach(() => {
      subtitleLoaderRewireAPI.__ResetDependency__('storeSubtitle');
    });
    it('should SubtitleLoader instanceof EventEmitter', () => {
      expect(loader).to.be.an.instanceOf(EventEmitter);
    });
    it('should invoke storeSubtitle', (done) => {
      const testSrc = randStr();
      const testSubtitleLoader = new SubtitleLoader(testSrc, 'online');

      testSubtitleLoader.on('loading', () => {
        expect(storeSubtitleStub).to.have.been.called;
        done();
      });
    });
    it('should use storeSubtitle\'s id as subtitle\'s id', (done) => {
      const testId = randStr();
      storeSubtitleStub.resolves(testId);
      const testSrc = randStr();
      const testSubtitleLoader = new SubtitleLoader(testSrc, 'online');

      testSubtitleLoader.on('loading', (id) => {
        expect(testSubtitleLoader.id).to.equal(id);
        expect(id).to.equal(testId);
        done();
      });
    });

    it(`should throw ${ErrorCodes.SUBTITLE_INVALID_TYPE} when pass invalid type`, () => {
      expect(() => new SubtitleLoader('', 'invalid')).to.throw(SubtitleError).with.property('code', ErrorCodes.SUBTITLE_INVALID_TYPE);
    });
    it(`should throw ${ErrorCodes.SUBTITLE_INVALID_FORMAT} when no loader found`, () => {
      expect(() => new SubtitleLoader('', 'local')).to.throw(SubtitleError).with.property('code', ErrorCodes.SUBTITLE_INVALID_FORMAT);
    });
  });

  describe('metaInfo test', () => {
    it('should metaInfo change emit meta-change event', () => {
      const { metaInfo } = loader;
      const emitSpy = sandbox.spy();
      loader.on('meta-change', emitSpy);
      const randomField = Math.random().toString();
      const randomValue = Math.random();

      metaInfo[randomField] = randomValue;

      sinon.assert.calledWith(emitSpy, { field: randomField, value: randomValue });
    });

    it('should not emit meta-change event when not change', () => {
      const { metaInfo } = loader;
      const randomField = Math.random().toString();
      const randomValue = Math.random();
      metaInfo[randomField] = randomValue;
      const emitSpy = sandbox.spy();
      loader.on('meta-change', emitSpy);

      metaInfo[randomField] = randomValue;

      sinon.assert.notCalled(emitSpy);
    });
  });
});
