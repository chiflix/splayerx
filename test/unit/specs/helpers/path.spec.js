import { filePathToUrl, fileUrlToPath, parseNameFromPath } from '../../../../src/renderer/helpers/path';

describe('helper.path', () => {
  it('should convert file path to url correctly', () => {
    expect(filePathToUrl('/home/test/测试.mp4')).to.be.equal('file:///home/test/%E6%B5%8B%E8%AF%95.mp4');
    expect(filePathToUrl('C:\\Users\\test\\测试.mp4')).to.be.equal('file:///C:/Users/test/%E6%B5%8B%E8%AF%95.mp4');
  });
  it('should convert file url to path correctly', () => {
    const currentPlatform = process.platform;

    ['darwin', 'freebsd', 'linux', 'openbsd'].forEach((platform) => {
      Object.defineProperty(process, 'platform', { value: platform });
      expect(fileUrlToPath('file:///home/test/%E6%B5%8B%E8%AF%95.mp4?a=1&b=2#c')).to.be.equal('/home/test/测试.mp4');
    });

    Object.defineProperty(process, 'platform', { value: 'win32' });
    expect(fileUrlToPath('file:///C:/Users/test/%E6%B5%8B%E8%AF%95.mp4?a=1&b=2#c')).to.be.equal('C:\\Users\\test\\测试.mp4');

    Object.defineProperty(process, 'platform', { value: currentPlatform });
  });
  it('should parse name correctly', () => {
    ['S01E01', 'S1E1', 'SE01EP01.3gp2', 'SE1EP1', '第一季第一集', '第1季第1集', '第01季第01集'].forEach((e) => {
      expect(JSON.stringify(parseNameFromPath(e))).to.be.equals(JSON.stringify({
        season: '01',
        episode: '01',
      }));
    });
    ['EP01', '第一集.test.mp4', '第1集.mp4', ' 第01集', '01集'].forEach((e) => {
      expect(JSON.stringify(parseNameFromPath(e))).to.be.equals(JSON.stringify({
        season: null,
        episode: '01',
      }));
    });
    ['S11E12', 'S11E12', 'SE11EP12.se4', 'SE11EP12.mp5', '一十一季十二集', '第十一季第十二集', '第11季第一十二集', '第一十一季第12集'].forEach((e) => {
      expect(JSON.stringify(parseNameFromPath(e))).to.be.equals(JSON.stringify({
        season: '11',
        episode: '12',
      }));
    });
  });
});
