import sinon from 'sinon';
import partial from 'lodash/partial';
import * as utils from '@/components/Subtitle/SubtitleLoader/utils';
import { SubtitleError, ErrorCodes } from '@/components/Subtitle/SubtitleLoader/errors';
import { join, dirname } from 'path';

describe('SubtitleLoader utils functions unit test', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('toArray unit tests', () => {
    const { toArray } = utils;
    it('should toArray turn one element to an array', () => {
      expect(toArray(1)).to.deep.equal([1]);
    });

    it('should toArray return what it is when passed an array', () => {
      const testArray = [];

      expect(toArray(testArray)).to.equal(testArray);
    });
  });

  it('should localFormatLoader return extname without dot', () => {
    const { localFormatLoader } = utils;

    expect(localFormatLoader('.ext.exx')).to.equal('exx');
  });

  it('localEncodingLoader test', (done) => {
    const path = join(process.cwd(), 'test/assets/test.srt');

    utils.localEncodingLoader(path).then((result) => {
      expect(result).to.equal('ISO-8859-1');
      done();
    });
  });
});
