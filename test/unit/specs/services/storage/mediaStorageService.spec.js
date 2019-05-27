import sinon from 'sinon';
import MediaStorageService from '../../../../../src/renderer/services/storage/mediaStorageService';
import CacheFile from '../../../../../src/renderer/libs/cacheFile';

describe('MediaStorageService logic service', () => {
  let mediaStorageService;
  const mediaHash = 'a-b-c-d';
  let path = `/${mediaHash}/`;

  describe('first handle this video media', () => {
    beforeEach(() => {
      sinon.stub(CacheFile.prototype, 'getPathBy').callsFake(() => path);
      sinon.stub(CacheFile.prototype, 'readDirBy').callsFake(() => []);
      const cacheFile = new CacheFile(); // CacheFile 内部方法已经被sinon.stub替换成简单逻辑
      mediaStorageService = new MediaStorageService(cacheFile);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('getImageBy return null', async () => {
      const result = await mediaStorageService.getImageBy(mediaHash, 'cover');
      expect(result).to.be.equal(null);
    });

    it('readVideoInfo return {}', async () => {
      const result = await mediaStorageService.readVideoInfo(mediaHash);
      expect(JSON.stringify(result)).to.be.equal(JSON.stringify({}));
    });

    it('generatePathBy cover return cover path', async () => {
      const result = await mediaStorageService.generatePathBy(mediaHash, 'cover');
      expect(result.includes('cover.jpg')).to.be.equal(true);
    });
  });

  describe('video media has cached', () => {
    beforeEach(() => {
      path = `/video/${mediaHash}/`;
      sinon.stub(CacheFile.prototype, 'getPathBy').callsFake(() => path);
      sinon.stub(CacheFile.prototype, 'readDirBy').callsFake(() => ['cover.jpg', 'thumbnail.jpg']);
      const cacheFile = new CacheFile(); // CacheFile 内部方法已经被sinon.stub替换成简单逻辑
      mediaStorageService = new MediaStorageService(cacheFile);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('getImageBy cover return true', async () => {
      const result = await mediaStorageService.getImageBy(mediaHash, 'cover');
      expect(result).to.be.equal(`${path}cover.jpg`);
    });

    it('getImageBy thumbnail return true', async () => {
      const result = await mediaStorageService.getImageBy(mediaHash, 'thumbnail');
      expect(result).to.be.equal(`${path}thumbnail.jpg`);
    });

    it('readVideoInfo return {}', async () => {
      const result = await mediaStorageService.readVideoInfo(mediaHash);
      expect(JSON.stringify(result)).to.be.equal(JSON.stringify({
        cover: `${path}cover.jpg`,
        thumbnail: `${path}thumbnail.jpg`,
      }));
    });

    it('generatePathBy cover return cover path', async () => {
      const result = await mediaStorageService.generatePathBy(mediaHash, 'cover');
      expect(result).to.be.equal(`${path}cover.jpg`);
    });
  });
});
