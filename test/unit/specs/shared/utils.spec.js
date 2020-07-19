import {
  getValidSubtitleExtensions,
  getValidVideoExtensions,
  isSubtitle,
  isVideo,
} from '@/../shared/utils';

describe('shared/utils', () => {
  it('should contains proper subtitle extensions', () => {
    expect(getValidSubtitleExtensions()).to.include('srt');
    expect(getValidSubtitleExtensions()).to.not.include('mp4');
    expect(isSubtitle('filename.vtt')).to.be.equal(true);
    expect(isSubtitle('filename.ASS')).to.be.equal(true);
  });

  it('should contains proper video extensions', () => {
    expect(getValidVideoExtensions()).to.include('mp4');
    expect(getValidVideoExtensions()).to.not.include('srt');
    expect(isVideo('filename.mkv')).to.be.equal(true);
    expect(isVideo('filename.WMV')).to.be.equal(true);
  });

  it('should not be able to modify', () => {
    expect(() => getValidSubtitleExtensions().push('')).to.throw();
    expect(() => getValidVideoExtensions().push('')).to.throw();
  });
});
