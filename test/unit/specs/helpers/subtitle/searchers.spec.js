import sinon from 'sinon';
import mock from 'mock-fs';
import { resolve } from 'path';
import { searchForLocalList, fetchOnlineList, __RewireAPI__ as SearchersRewireAPI } from '@/helpers/subtitle/searchers';
import SubtitleLoader from '@/components/Subtitle/SubtitleLoader';
import Sagi from '@/libs/sagi';

describe('Subtitle Searchers Unit Tests', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('function - searchForLocalList', () => {
    const videoDir = resolve('test/assets/');
    const videoSrc = resolve(videoDir, 'subtitleTestVideo.avi');
    beforeEach(() => {
      mock({
        [resolve('test/assets/')]: {
          'subtitleTestVideo.avi': '',
          'subtitleTestVideo.srt': '',
          'subtitleTestVideo.ass': '',
          'subtitleTestVideo.vtt': '',
          'subtitletestvideo.ass': '',
          'subtitleTestVideo.VTT': '',
          'subtitleTestVideo.ssa': '',
          'subtitleTestVideo.sub': '',
          'subtitleTestVideo.idx': '',
          'subtitleTestVideo.chn.srt': '',
          'subtitleTestVideo.chn.S01E02.srt': '',
          'subtitleTestVideo1.srt': '',
        },
      });
    });
    afterEach(() => {
      mock.restore();
    });

    const filenameToLocalSubtitle = filename => ({
      src: resolve(videoDir, filename),
      type: 'local',
    });

    it('should find subtitle with the same filename', (done) => {
      searchForLocalList(videoSrc, SubtitleLoader.supportedFormats).then((results) => {
        expect(results).to.deep.include(filenameToLocalSubtitle('subtitleTestVideo.srt'));
        expect(results).to.deep.include(filenameToLocalSubtitle('subtitleTestVideo.ass'));
        expect(results).to.deep.include(filenameToLocalSubtitle('subtitleTestVideo.vtt'));
        done();
      });
    });

    it('should find subtitle with the same filename regardless of case', (done) => {
      searchForLocalList(videoSrc, SubtitleLoader.supportedFormats).then((results) => {
        expect(results).to.deep.include(filenameToLocalSubtitle('subtitleTestVideo.VTT'));
        expect(results).to.deep.include(filenameToLocalSubtitle('subtitletestvideo.ass'));
        done();
      }).catch(done);
    });

    it('should not find subtitle with one or more dot other than video\'s filename', (done) => {
      searchForLocalList(videoSrc, SubtitleLoader.supportedFormats).then((results) => {
        expect(results).to.not.deep.include(filenameToLocalSubtitle('subtitleTestVideo.chn.srt'));
        expect(results).to.not.deep.include(filenameToLocalSubtitle('subtitleTestVideo.chn.S01E02.srt'));
        done();
      });
    });

    it('should not find subtitle with more character other than video\'s filename', (done) => {
      searchForLocalList(videoSrc, SubtitleLoader.supportedFormats).then((results) => {
        expect(results).to.not.deep.include(filenameToLocalSubtitle('subtitleTestVideo1.srt'));
        done();
      });
    });

    it('should not find subtitle with not supported extension', (done) => {
      searchForLocalList(videoSrc, SubtitleLoader.supportedFormats).then((results) => {
        expect(results).to.not.deep.include(filenameToLocalSubtitle('subtitleTestVideo1.ssa'));
        expect(results).to.not.deep.include(filenameToLocalSubtitle('subtitleTestVideo1.sub'));
        expect(results).to.not.deep.include(filenameToLocalSubtitle('subtitleTestVideo1.idx'));
        done();
      });
    });

    it('should not find video itself', (done) => {
      searchForLocalList(videoSrc, [...SubtitleLoader.supportedFormats, 'avi']).then((results) => {
        expect(results).to.not.deep.include(filenameToLocalSubtitle('subtitleTestVideo.avi'));
        done();
      });
    });

    it('should missing supportedExtensions default to srt, ass and vtt', (done) => {
      searchForLocalList(videoSrc).then((results) => {
        expect(results).to.deep.include(filenameToLocalSubtitle('subtitleTestVideo.srt'));
        expect(results).to.deep.include(filenameToLocalSubtitle('subtitleTestVideo.ass'));
        expect(results).to.deep.include(filenameToLocalSubtitle('subtitleTestVideo.vtt'));
        done();
      });
    });
  });

  describe('function - fetchOnlineList', () => {
    const randStr = () => Math.random().toString(36).substring(7);
    const generateMediaIdentity = () => `${randStr()}-${randStr()}-${randStr()}-${randStr()}`;
    let videoSrc;
    let mediaIdentity;
    let mediaQuickHashStub;
    let mediaTranslateStub;
    beforeEach(() => {
      videoSrc = randStr();
      mediaIdentity = generateMediaIdentity();
      mediaQuickHashStub = sandbox.stub().resolves(mediaIdentity);
      SearchersRewireAPI.__Rewire__('calculateMediaIdentity', mediaQuickHashStub);
      mediaTranslateStub = sandbox.stub(Sagi, 'mediaTranslate');
      mediaTranslateStub.resolves([{
        transcriptIdentity: generateMediaIdentity(),
      }]);
    });
    afterEach(() => {
      SearchersRewireAPI.__ResetDependency__('calculateMediaIdentity');
    });

    it('should fetchOnlineList invoke mediaQuickHash', (done) => {
      fetchOnlineList(videoSrc).then(() => {
        sandbox.assert.calledWithExactly(mediaQuickHashStub, videoSrc);
        done();
      }).catch(err => done(err));
    });

    it('should fetchOnlineList invoke mediaTranslate', (done) => {
      fetchOnlineList(videoSrc).then(() => {
        sandbox.assert.calledWithExactly(mediaTranslateStub, {
          mediaIdentity,
          languageCode: undefined,
          hints: undefined,
        });
        done();
      }).catch(err => done(err));
    });
  });
});
