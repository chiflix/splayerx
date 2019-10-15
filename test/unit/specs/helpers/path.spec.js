import { readFileSync } from 'fs';
import { filePathToUrl, fileUrlToPath, parseNameFromPath } from '../../../../src/renderer/helpers/path';

describe('helper.path', () => {
  it('should convert file path to url correctly', () => {
    expect(filePathToUrl('/home/test/测试.mp4')).to.be.equal('file:///home/test/%E6%B5%8B%E8%AF%95.mp4');
    expect(filePathToUrl('C:\\Users\\test\\测试.mp4')).to.be.equal('file:///C:/Users/test/%E6%B5%8B%E8%AF%95.mp4');
  });
  it('should convert file url to path correctly', () => {
    ['darwin', 'freebsd', 'linux', 'openbsd'].forEach((platform) => {
      expect(fileUrlToPath('file:///home/test/%E6%B5%8B%E8%AF%95.mp4?a=1&b=2#c', { platform })).to.be.equal('/home/test/测试.mp4');
    });

    expect(fileUrlToPath('file:///C:/Users/test/%E6%B5%8B%E8%AF%95.mp4?a=1&b=2#c', { platform: 'win32' })).to.be.equal('C:\\Users\\test\\测试.mp4');
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
