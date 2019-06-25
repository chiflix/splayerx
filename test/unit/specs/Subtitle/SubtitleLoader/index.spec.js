import sinon from 'sinon';
import EventEmitter from 'events';
import SubtitleLoader, { __RewireAPI__ as subtitleLoaderRewireAPI } from '@/components/Subtitle/SubtitleLoader';
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
    it('should not invoke storeSubtitle when id available', (done) => {
      const testSrc = randStr();
      const testId = randStr();
      const testSubtitleLoader = new SubtitleLoader(testSrc, 'online', { id: testId });

      testSubtitleLoader.on('loading', (id) => {
        expect(storeSubtitleStub).to.not.have.been.called;
        expect(id).to.equal(testId);
        done();
      });
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
