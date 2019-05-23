import helpers from '@/helpers';
import { MediaStorageService } from '@/services/storage/mediaStorageService';
import { CacheFile } from '../../../../../src/renderer/libs/cacheFile';
import { ThumbnailService } from '../../../../../src/renderer/services/media/thumbnailService';

describe('thumbnaiService logic service', () => {
  const cacheFile = new CacheFile();
  const mediaStorageService = new MediaStorageService(cacheFile);
  const thumbnailService = new ThumbnailService(mediaStorageService);
  let mediaHash = '';

  beforeEach(async () => {
    mediaHash = await helpers.methods.mediaQuickHash('./test/assets/test.avi');
  });

  it('first getThumbnailImage return null', async () => {
    const result = await thumbnailService.getThumbnailImage(mediaHash);
    expect(result).to.be.equal(null);
  });

  it('first generateThumbnailImage return image path', async () => {
    const result = await thumbnailService.generateThumbnailImage(mediaHash);
    expect(result.includes('thumbnail.jpg')).to.be.equal(true);
  });
});
