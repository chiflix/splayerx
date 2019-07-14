import {
  getValidSubtitleExtensions,
  getValidSubtitleRegex,
  getValidVideoExtensions,
  getValidVideoRegex,
} from '@/../shared/utils';

describe('shared/utils', () => {
  it('should contains proper subtitle extensions', () => {
    expect(getValidSubtitleExtensions()).to.include('srt');
    expect(getValidSubtitleExtensions()).to.not.include('mp4');
    expect('filename.vtt').to.match(getValidSubtitleRegex());
    expect('filename.ASS').to.match(getValidSubtitleRegex());
  });

  it('should contains proper video extensions', () => {
    expect(getValidVideoExtensions()).to.include('mp4');
    expect(getValidVideoExtensions()).to.not.include('srt');
    expect('filename.mkv').to.match(getValidVideoRegex());
    expect('filename.WMV').to.match(getValidVideoRegex());
  });

  it('should not be able to modify', () => {
    expect(() => getValidSubtitleExtensions().push('')).to.throw();
    expect(() => getValidVideoExtensions().push('')).to.throw();
  });
});
