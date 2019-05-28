import sinon from 'sinon';
import MediaStorageService from '@/services/storage/MediaStorageService';
import CacheFile from '../../../../../src/renderer/libs/CacheFile';
import ThumbnailService from '../../../../../src/renderer/services/media/ThumbnailService';

describe('thumbnaiService logic service', () => {
  let thumbnailService;

  describe('first handle this video media, not have ThumbnailImage', () => {
    let path;
    const mediaHash = 'a-b-c-d';
    beforeEach(() => {
      path = `/video/${mediaHash}/thumbnail.jpg`;
      sinon.stub(MediaStorageService.prototype, 'generatePathBy').callsFake(() => path);
      sinon.stub(MediaStorageService.prototype, 'getImageBy').callsFake(() => null);
      const cacheFile = new CacheFile();
      // MediaStorageService 内部方法已经被sinon.stub替换成简单逻辑
      const mediaStorageService = new MediaStorageService(cacheFile);
      thumbnailService = new ThumbnailService(mediaStorageService);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should return no result by getThumbnailImage', async () => {
      const result = await thumbnailService.getThumbnailImage(mediaHash);
      expect(result).to.be.equal(null);
    });

    it('should successfully generateThumbnailImage', async () => {
      const result = await thumbnailService.generateThumbnailImage(mediaHash);
      expect(result).to.be.equal(path);
    });

    it('should successfully return [100, 800] by calculateThumbnailPosition 1500', () => {
      const result = thumbnailService.calculateThumbnailPosition(1500, 7000, 380);
      expect(result[0]).to.be.equal(100);
      expect(result[1]).to.be.equal(800);
    });

    it('should successfully return [200, 1600] by calculateThumbnailPosition 3000', () => {
      const result = thumbnailService.calculateThumbnailPosition(3000, 7000, 380);
      expect(result[0]).to.be.equal(200);
      expect(result[1]).to.be.equal(1600);
    });
  });

  describe('video media has cached ThumbnailImage', () => {
    let path;
    const mediaHash = 'a-b-c-d';
    beforeEach(() => {
      path = `/video/${mediaHash}/thumbnail.jpg`;
      sinon.stub(MediaStorageService.prototype, 'generatePathBy').callsFake(() => path);
      sinon.stub(MediaStorageService.prototype, 'getImageBy').callsFake(() => path);
      const cacheFile = new CacheFile();
      // MediaStorageService 内部方法已经被sinon.stub替换成简单逻辑
      const mediaStorageService = new MediaStorageService(cacheFile);
      thumbnailService = new ThumbnailService(mediaStorageService);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should return no result by getThumbnailImage', async () => {
      const result = await thumbnailService.getThumbnailImage(mediaHash);
      expect(result).to.be.equal(path);
    });
  });
});
