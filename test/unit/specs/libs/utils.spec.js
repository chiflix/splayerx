import { readFileSync } from 'fs';
import {
  getTextWidth,
  generateShortCutImageBy,
  mediaQuickHash,
  timecodeFromSeconds,
  parseNameFromPath,
} from '@/libs/utils';

describe.only('libs utils', () => {
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

  it('should parse name correctly', () => {
    [
      '美剧.S01E01.mkv',
      '美剧.S1E1.x264-SVA.mp4',
      '美剧.SE01EP01.3gp2',
      '美剧.SE1EP1.x264-SVA,rmvb',
      '美剧.第一季第一集.mp4',
      '天龙八部第1季第1集.mp4',
      '天龙八部.第01季第01集.mp4',
      'Greys Anatomy - s01e01.mp4',
      'Greys Anatomy - s01e01 x264.HD.mp4',
      '7o9-ancient-aliens-s01e01-720p-bluray-x264.mkv',
    ].forEach((e) => {
      expect(JSON.stringify(parseNameFromPath(e))).to.be.equals(JSON.stringify({
        season: '01',
        episode: '01',
      }));
    });
    [
      '越狱.01.h456.1080P.EP01blue.mp4',
      '越狱.01.h456.1080P.EP01].mp4',
      '越狱.01.h456.1080P.E01_xx.mp4',
      '越狱.01.h456.1080P.E01 .xx.mp4',
      '越狱.01.h456.1080P.ep01.xx.mp4',
      '越狱.01.h456.1080P.E01.xx.mp4',
      '越狱.01.h456.1080P.e01-.xx.mp4',
      '美剧.EP01.x264-SVA.mp4',
      '天龙八部第一集.test.mp4',
      '天龙八部.第1集.mp4',
      ' 天龙八部第01集.mkv',
    ].forEach((e) => {
      expect(JSON.stringify(parseNameFromPath(e))).to.be.equals(JSON.stringify({
        season: null,
        episode: '01',
      }));
    });
    [
      '啦啦队之舞.Cheer.Dance.S11E12.Chi_Jap.HDTVrip.1280X720.mp4',
      '啦啦队之舞.S11E12.Chi_Jap.HDTVrip.1280X720.mp4',
      '美剧.SE11EP12.se4',
      '美剧.SE11EP12.mp5',
      '天龙八部第一十一季第十二集.mp4',
      '天龙八部.第十一季第十二集.3gp2',
      '天龙八部第11季第一十二集.mp4',
      '天龙八部第一十一季第12集.mkv',
    ].forEach((e) => {
      expect(JSON.stringify(parseNameFromPath(e))).to.be.equals(JSON.stringify({
        season: '11',
        episode: '12',
      }));
    });
    [
      'Apple Special Event. October 22, 2013..mp4',
      'cls-kungfuhubs1080dub.mp4',
      'ewdp-girlgifts720p.mp4',
      'Event.测试测绘试p6~p7.mkv',
      'Event.四季花园.mkv',
    ].forEach((e) => {
      expect(JSON.stringify(parseNameFromPath(e))).to.be.equals(JSON.stringify({
        season: null,
        episode: null,
      }));
    });
    [
      '越狱.SE01.h456.1080P.01.mp4',
      '/User/harry/美剧.S08E08/越狱.SE01.h456.1080P.01.mp4',
      '越狱.s01.h456.1080P.01.mp4',
      '越狱_sE01.h456.1080P.01.mp4',
      '越狱[s01.h456.1080P.01.mp4',
      '越狱-s01.h456.1080P.01.mp4',
      '越狱 sE01.h456.1080P.01.mp4',
    ].forEach((e) => {
      expect(JSON.stringify(parseNameFromPath(e))).to.be.equals(JSON.stringify({
        season: '01',
        episode: null,
      }));
    });
  });

  it('should hit names percentage > 93%', () => {
    const str = readFileSync('./test/assets/names.txt', {}).toString();
    const j = {};
    let count = 0;
    const names = str.split('\n').filter((e) => {
      if (!e) return false;
      if (j[e]) return false;
      j[e] = true;
      return true;
    });
    names.forEach((e) => {
      if (parseNameFromPath(e).episode !== null) {
        count += 1;
      }
    });
    expect(count / names.length > 0.93).to.be.equals(true);
  });
});
