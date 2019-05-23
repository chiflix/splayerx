import helpers from '@/helpers';
import { MediaStorageService } from '../../../../../src/renderer/services/storage/mediaStorageService';
import { CacheFile } from '../../../../../src/renderer/libs/cacheFile';

describe('MediaStorageService logic service', () => {
  const cacheFile = new CacheFile();
  const mediaStorageService = new MediaStorageService(cacheFile);
  let mediaHash = '';

  beforeEach(async () => {
    mediaHash = await helpers.methods.mediaQuickHash('./test/assets/test.avi');
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
