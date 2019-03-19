/*
 * @Author: tanghaixiang@xindong.com
 * @Date: 2019-03-01 11:55:34
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-03-19 15:15:09
 */

import helpers from '@/helpers';
import { writeFileSync } from 'fs';
import {
  getVideoInfoByMediaHash,
  generateThumbnailPathByMediaHash,
  generateCoverPathByMediaHash,
  generateShortCutPathByMediaHash,
  deleteDirByMediaHash,
  clearAll,
  addSubtitleByMediaHash,
  writeSubtitleByPath,
  deleteFileByPath,
  getVideoSubtitlesByMediaHash,
} from '../../../../src/renderer/helpers/cacheFileStorage';

describe('helper.cacheFileStorage', () => {
  let mediaHash = '';
  let addSubtitlePath = '';

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

  it('should addSubtitleByMediaHash success', async () => {
    const result = await addSubtitleByMediaHash(mediaHash, '**', { type: 'modified' });
    expect(Object.prototype.toString.call(result).toLowerCase()).to.be.equal('[object object]');
    addSubtitlePath = result.path;
  });

  it('should getVideoSubtitlesByMediaHash with result', async () => {
    const result = await getVideoSubtitlesByMediaHash(mediaHash);
    const subs = Array.prototype.concat.apply([], result);
    expect(subs[0].src).to.be.equal(addSubtitlePath);
  });

  it('should writeSubtitleByPath success', async () => {
    const result = await writeSubtitleByPath(addSubtitlePath, 'xxxx');
    expect(result).to.be.equal(addSubtitlePath);
  });

  it('should deleteFileByPath success', async () => {
    const result = await deleteFileByPath(addSubtitlePath);
    expect(result).to.be.equal(true);
  });
});
