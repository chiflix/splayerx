import { getTextWidth } from '@/libs/utils';

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
});
