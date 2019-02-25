import sinon from 'sinon';
import * as utils from '@/components/Subtitle/SubtitleLoader/utils';
import { join } from 'path';

describe('SubtitleLoader utils functions unit test', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
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
