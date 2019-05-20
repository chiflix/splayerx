import { IMediaStorable } from '@/services/media/index';
import cacheFileInstance, { CacheFile } from '@/libs/cacheFile';

export class MediaStorageService implements IMediaStorable {
  async generate(mediaHash: string, tag: string): Promise<string | null> {
    try {
      const r = await this.cacheFile.generate(mediaHash, tag);
      return r;
    } catch (err) {
      return null
    }
  }

  constructor(private readonly cacheFile: CacheFile) {
  }
  async getCover(hash: string): Promise<string | null> {
    try {
      const r = await this.cacheFile.read(hash);
      return r && r.cover ? r.cover : null;
    } catch (err) {
      return null
    }
  }
  async getThumbnail(mediaHash: string): Promise<string | null> {
    try {
      const r = await this.cacheFile.read(mediaHash);
      return r && r.thumbnail ? r.thumbnail : null;
    } catch (err) {
      return null
    }
  }
}

export default new MediaStorageService(cacheFileInstance);