import { mediaQuickHash } from '@/libs/utils';
import CacheFile from '../../../../src/renderer/libs/CacheFile';

describe('CacheFile libs', () => {
  const cacheFile = new CacheFile();
  let mediaHash = '';

  beforeEach(async () => {
    mediaHash = await mediaQuickHash('./test/assets/test.avi');
  });

  it('should successfully getPathBy return path with mediaHash', async () => {
    const result = cacheFile.getPathBy(mediaHash);
    expect(result.includes(mediaHash)).to.be.equal(true);
  });

  it('should successfully createDirBy', async () => {
    const result = await cacheFile.createDirBy(mediaHash);
    expect(result).to.be.equal(true);
  });

  it('should return no result by readDirBy', async () => {
    const result = await cacheFile.readDirBy(mediaHash);
    expect(JSON.stringify(result)).to.be.equal(JSON.stringify([]));
  });

  it('should successfully removeDirBy', async () => {
    const result = await cacheFile.removeDirBy(mediaHash);
    expect(result).to.be.equal(true);
  });
});
