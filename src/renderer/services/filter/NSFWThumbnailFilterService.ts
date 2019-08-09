import path from 'path';
import { IMediaFilter } from '@/interfaces/IMediaFilter';
import { filePathToUrl } from '@/helpers/path';
import NSFWJS, { NSFW_CLASSES } from '@/libs/NSFWJS';
import { log } from '@/libs/Log';

const IMAGE_SIZE = 224; // default to Mobilenet v2

export default class NSFWFilterService implements IMediaFilter {
  private nsfwnet: NSFWJS;

  private getNsfwNetPromise: Promise<NSFWJS> | null;

  private async getNsfwNet() {
    if (this.nsfwnet) return this.nsfwnet;
    this.nsfwnet = new NSFWJS({ size: IMAGE_SIZE });
    await this.nsfwnet.load(filePathToUrl(path.join(__static, 'nsfw/model.json')));
    return this.nsfwnet;
  }

  private async getNsfwNeWithtLock() {
    try {
      if (!this.getNsfwNetPromise) this.getNsfwNetPromise = this.getNsfwNet();
      const nsfwnet = await this.getNsfwNetPromise;
      return nsfwnet;
    } finally {
      this.getNsfwNetPromise = null;
    }
  }

  public warmup() {
    setTimeout(() => {
      try {
        this.getNsfwNeWithtLock();
      } catch (ex) {
        //
      }
    });
  }

  /**
   * Check if image is not safe for work
   * @param src Source of image
   */
  public async checkImage(src: string) {
    try {
      const timeKey = Math.random().toString();
      console.time(timeKey);
      const nsfwnet = await this.getNsfwNeWithtLock();
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
        setTimeout(() => reject(new Error('NSFW img timeout')), 1000);
      });
      const result = await nsfwnet.classify(img);
      const isNsfw = result.some(item => (
        item.className === NSFW_CLASSES[1] || item.className === NSFW_CLASSES[3]
      ) && item.probability >= 0.8);
      if (isNsfw) log.debug('nsfw', src, result);
      console.timeEnd(timeKey);
      return isNsfw;
    } catch (ex) {
      console.error(ex, src);
      return false;
    }
  }
}

export const nsfwThumbnailFilterService = new NSFWFilterService();
