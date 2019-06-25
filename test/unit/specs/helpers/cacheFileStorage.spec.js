/*
 * @Author: tanghaixiang@xindong.com
 * @Date: 2019-03-01 11:55:34
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-03-01 13:35:13
 */

import { writeFileSync } from 'fs';
import helpers from '@/helpers';
import {
  getVideoInfoByMediaHash,
  generateThumbnailPathByMediaHash,
  generateCoverPathByMediaHash,
  generateShortCutPathByMediaHash,
  deleteDirByMediaHash,
  clearAll,
} from '../../../../src/renderer/helpers/cacheFileStorage';

describe('helper.cacheFileStorage', () => {
  let mediaHash = '';

  it('should clearAll success', async () => {
    const result = await clearAll(mediaHash);
    expect(result).to.be.equal(true);
  });

  it('should getVideoInfoByMediaHash with {}', async () => {
    mediaHash = await helpers.methods.mediaQuickHash('./test/assets/test.avi');
    const result = await getVideoInfoByMediaHash(mediaHash);
    expect(JSON.stringify(result)).to.be.equal(JSON.stringify({}));
  });

  it('should generateThumbnailPathByMediaHash success', async () => {
    const result = await generateThumbnailPathByMediaHash(mediaHash);
    expect(result.includes('thumbnail.jpg')).to.be.equal(true);
  });

  it('should getVideoInfoByMediaHash with some info', async () => {
    const thunmbnailPath = await generateThumbnailPathByMediaHash(mediaHash);
    writeFileSync(thunmbnailPath, 's');
    let result = await getVideoInfoByMediaHash(mediaHash);
    expect(result.thumbnail).to.be.equal(thunmbnailPath);

    const coverPath = await generateCoverPathByMediaHash(mediaHash);
    writeFileSync(coverPath, 's');
    result = await getVideoInfoByMediaHash(mediaHash);
    expect(result.cover).to.be.equal(coverPath);

    const shortCutPath = await generateShortCutPathByMediaHash(mediaHash);
    writeFileSync(shortCutPath, 's');
    result = await getVideoInfoByMediaHash(mediaHash);
    expect(JSON.stringify(result)).to.be.equal(JSON.stringify({
      cover: coverPath,
      shortCut: shortCutPath,
      thumbnail: thunmbnailPath,
    }));
  });

  it('should deleteDirByMediaHash success', async () => {
    const result = await deleteDirByMediaHash(mediaHash);
    expect(result).to.be.equal(true);
  });

  it('should getVideoInfoByMediaHash with {}', async () => {
    const result = await getVideoInfoByMediaHash(mediaHash);
    expect(JSON.stringify(result)).to.be.equal(JSON.stringify({}));
  });

  it('should clearAll success', async () => {
    const result = await clearAll(mediaHash);
    expect(result).to.be.equal(true);
  });
});
