import { ThumbnailRequest } from '@/components/PlayingView/ThumbnailDisplay';
import mediaStorageService, { MediaStorageService } from '@/services/storage/mediaStorageService';
import { ipcRenderer } from 'electron';

export class ThumbnailService implements ThumbnailRequest {
  async generateImage(mediaHash: string, videoSrc: string, cols: number): Promise<string> {
    try {
      const gpath = await this.mediaStorageService.generate(mediaHash, 'thumbnail');
      if (gpath) {
        const info = {
          src: videoSrc,
          outPath: gpath,
          width: '272',
          num: { rows: '10', cols: `${Math.ceil(cols / 10)}` },
        };
        ipcRenderer.send('generateThumbnails', info);
        return gpath;
      }
    } catch (err) {
    }
    return '';
  }
  constructor(private readonly mediaStorageService: MediaStorageService) {
  }
  async getImage(mediaHash: string): Promise<string | null> {
    try {
      const result = await this.mediaStorageService.getThumbnail(mediaHash);
      return result
    } catch (err) {
      return null
    }
  }
}

export default new ThumbnailService(mediaStorageService)