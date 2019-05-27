import helpers from '@/helpers';
import CacheFile from '../../../../src/renderer/libs/cacheFile';

describe('CacheFile libs', () => {
  const cacheFile = new CacheFile();
  let mediaHash = '';

  beforeEach(async () => {
    mediaHash = await helpers.methods.mediaQuickHash('./test/assets/test.avi');
  });

  it('getPathBy return path with mediaHash', async () => {
    const result = cacheFile.getPathBy(mediaHash);
    expect(result.includes(mediaHash)).to.be.equal(true);
  });

  it('createDirBy return true', async () => {
    const result = await cacheFile.createDirBy(mediaHash);
    expect(result).to.be.equal(true);
  });

  it('readDirBy return []', async () => {
    const result = await cacheFile.readDirBy(mediaHash);
    expect(JSON.stringify(result)).to.be.equal(JSON.stringify([]));
  });

  it('removeDirBy return true', async () => {
    const result = await cacheFile.removeDirBy(mediaHash);
    expect(result).to.be.equal(true);
  });
});

