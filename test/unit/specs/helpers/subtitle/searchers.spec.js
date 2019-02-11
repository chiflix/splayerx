import { searchforLocalList } from '@/helpers/subtitle/searchers';
import sinon from 'sinon';
import mock from 'mock-fs';
import { resolve } from 'path';
import SubtitleLoader from '@/components/Subtitle/SubtitleLoader';

describe('Subtitle Searchers Unit Tests', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('function - searchforLocalList', () => {
    const videoDir = resolve('test/assets/');
    const videoSrc = resolve(videoDir, 'subtitleTestVideo.avi');
    beforeEach(() => {
      mock({
        [resolve('test/assets/')]: {
          'subtitleTestVideo.avi': '',
          'subtitleTestVideo.srt': '',
          'subtitleTestVideo.ass': '',
          'subtitleTestVideo.vtt': '',
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
      searchforLocalList(videoSrc, SubtitleLoader.supportedFormats).then((results) => {
        expect(results).to.deep.include(filenameToLocalSubtitle('subtitleTestVideo.srt'));
        expect(results).to.deep.include(filenameToLocalSubtitle('subtitleTestVideo.ass'));
        expect(results).to.deep.include(filenameToLocalSubtitle('subtitleTestVideo.vtt'));
        done();
      });
    });

    it('should not find subtitle with one or more dot other than video\'s filename', (done) => {
      searchforLocalList(videoSrc, SubtitleLoader.supportedFormats).then((results) => {
        expect(results).to.not.deep.include(filenameToLocalSubtitle('subtitleTestVideo.chn.srt'));
        expect(results).to.not.deep.include(filenameToLocalSubtitle('subtitleTestVideo.chn.S01E02.srt'));
        done();
      });
    });

    it('should not find subtitle with more character other than video\'s filename', (done) => {
      searchforLocalList(videoSrc, SubtitleLoader.supportedFormats).then((results) => {
        expect(results).to.not.deep.include(filenameToLocalSubtitle('subtitleTestVideo1.srt'));
        done();
      });
    });

    it('should not find subtitle with not supported extension', (done) => {
      searchforLocalList(videoSrc, SubtitleLoader.supportedFormats).then((results) => {
        expect(results).to.not.deep.include(filenameToLocalSubtitle('subtitleTestVideo1.ssa'));
        expect(results).to.not.deep.include(filenameToLocalSubtitle('subtitleTestVideo1.sub'));
        expect(results).to.not.deep.include(filenameToLocalSubtitle('subtitleTestVideo1.idx'));
        done();
      });
    });

    it('should not find video itself', (done) => {
      searchforLocalList(videoSrc, [...SubtitleLoader.supportedFormats, 'avi']).then((results) => {
        expect(results).to.not.deep.include(filenameToLocalSubtitle('subtitleTestVideo.avi'));
        done();
      });
    });

    it('should missing supportedExtensions default to srt, ass and vtt', (done) => {
      searchforLocalList(videoSrc).then((results) => {
        expect(results).to.deep.include(filenameToLocalSubtitle('subtitleTestVideo.srt'));
        expect(results).to.deep.include(filenameToLocalSubtitle('subtitleTestVideo.ass'));
        expect(results).to.deep.include(filenameToLocalSubtitle('subtitleTestVideo.vtt'));
        done();
      });
    });
  });
});
