import { createSandbox } from 'sinon';
import * as utils from '@/components/Subtitle/SubtitleLoader/utils';

describe('SubtitleLoader utils functions unit test', () => {
  let sandbox = createSandbox();

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should localFormatLoader return extname without dot', () => {
    const { localFormatLoader } = utils;

    expect(localFormatLoader('.ext.exx')).to.equal('exx');
  });
});
