import {
  getTextWidth,
  generateShortCutImageBy,
  mediaQuickHash,
  timecodeFromSeconds,
} from '@/libs/utils';

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
  it('should return correct hash value', async () => {
    const expectedResult = '84f0e9e5e05f04b58f53e2617cc9c866-'
                        + 'f54d6eb31bef84839c3ce4fc2f57991c-'
                        + 'b1f0696aec64577228d93eabcc8eb69b-'
                        + 'f497c6684c4c6e50d0856b5328a4bedc';
    const functionResult = await mediaQuickHash('./test/assets/test.avi');
    expect(functionResult).to.be.equal(expectedResult);
  });
  describe('method - timecodeFromSeconds', () => {
    it('time < 60s', () => {
      const result = timecodeFromSeconds(59);
      expect(result).to.equal('00:59');
    });
    it('time > 60s && time < 10m', () => {
      const result = timecodeFromSeconds(590);
      expect(result).to.equal('09:50');
    });
    it('time > 10m && time < 1hour', () => {
      const result = timecodeFromSeconds(3590);
      expect(result).to.equal('59:50');
    });
    it('time > 1hour', () => {
      const result = timecodeFromSeconds(3610);
      expect(result).to.equal('1:00:10');
    });
  });
});
