import { getTextWidth, generateShortCutImageBy } from '@/libs/utils';

describe('libs utils', () => {
  let fontSize = '';
  let fontFamily = '';
  let text = '';
  beforeEach(() => {
    fontSize = '12px';
    fontFamily = 'PingFang SC';
    text = 'test for calculate text width';
  });

  it('should successfully calculate text width', () => {
    expect(getTextWidth(fontSize, fontFamily, text)).to.be.equal(164.281);
  });

  it('should successfully generate ShortCutImage', () => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const shortCut = generateShortCutImageBy(video, canvas, 500, 500);
    const result = shortCut.shortCut.length > 0 && shortCut.smallShortCut.length > 0;
    expect(result).to.be.equal(true);
  });
});
