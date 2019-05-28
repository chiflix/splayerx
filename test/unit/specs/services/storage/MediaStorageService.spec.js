import sinon from 'sinon';
import { join } from 'path';
import MediaStorageService from '../../../../../src/renderer/services/storage/MediaStorageService';
import CacheFile from '../../../../../src/renderer/libs/CacheFile';

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

    it('should return no result by getImageBy cover', async () => {
      const result = await mediaStorageService.getImageBy(mediaHash, 'cover');
      expect(result).to.be.equal(null);
    });

    it('should return empty object by readVideoInfo when video never cached or nothing cached', async () => {
      const result = await mediaStorageService.readVideoInfo(mediaHash);
      expect(JSON.stringify(result)).to.be.equal(JSON.stringify({}));
    });

    it('should successfully generatePathBy', async () => {
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

    it('should successfully return result by getImageBy cover', async () => {
      const result = await mediaStorageService.getImageBy(mediaHash, 'cover');
      expect(result).to.be.equal(join(path, 'cover.jpg'));
    });

    it('should successfully return result by getImageBy thumbnail', async () => {
      const result = await mediaStorageService.getImageBy(mediaHash, 'thumbnail');
      expect(result).to.be.equal(join(path, 'thumbnail.jpg'));
    });

    it('should successfully return result by readVideoInfo', async () => {
      const result = await mediaStorageService.readVideoInfo(mediaHash);
      expect(JSON.stringify(result)).to.be.equal(JSON.stringify({
        cover: join(path, 'cover.jpg'),
        thumbnail: join(path, 'thumbnail.jpg'),
      }));
    });

    it('should successfully generatePathBy', async () => {
      const result = await mediaStorageService.generatePathBy(mediaHash, 'cover');
      expect(result).to.be.equal(join(path, 'cover.jpg'));
    });
  });
});
