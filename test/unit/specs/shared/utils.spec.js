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
    expect(isSubtitle('filename.vtt')).toBe(true);
    expect(isSubtitle('filename.ASS')).toBe(true);
  });

  it('should contains proper video extensions', () => {
    expect(getValidVideoExtensions()).to.include('mp4');
    expect(getValidVideoExtensions()).to.not.include('srt');
    expect(isVideo('filename.mkv')).toBe(true);
    expect(isVideo('filename.WMV')).toBe(true);
  });

  it('should not be able to modify', () => {
    expect(() => getValidSubtitleExtensions().push('')).to.throw();
    expect(() => getValidVideoExtensions().push('')).to.throw();
  });
});
