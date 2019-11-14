import { writeFileSync } from 'fs';
import path from 'path';
import filesize from 'filesize';
import { toJpeg } from 'html-to-image';
import { getThumbnailPath } from '@/plugins/mediaTasks';
import { getMediaInfo } from '@/plugins/mediaTasks/index';
import { timecodeFromSeconds } from '@/libs/utils';
import { IVideoStream } from '@/plugins/mediaTasks/mediaInfoQueue';

interface IPostInfo {
  name: string;
  size: string;
  resolution: string;
  duration: number;
  durationFmt: string;
}

export default class ThumbnailPostService {
  public async getPostImage(src: string, duration: number, type: 3 | 4): Promise<string[]> {
    const interval = Math.ceil(duration / ((type * type) + 1));
    const width = type === 3 ? 760 : 576;
    const thumbnail = await getThumbnailPath(src, interval, width, type);
    if (!thumbnail) throw new Error('No Thumbnail');
    const results: string[] = [];
    const img = new Image();
    img.src = `file://${thumbnail.imgPath}`;
    return new Promise((resolve) => {
      img.addEventListener('load', () => {
        const height = img.height / (type + 1);
        const resultCanvas = document.createElement('canvas');
        resultCanvas.setAttribute('width', `${width}}px`);
        resultCanvas.setAttribute('height', `${height}px`);
        const ctx = resultCanvas.getContext('2d') as CanvasRenderingContext2D;
        for (let i = 0; i <= type - 1; i += 1) {
          for (let j = 0; j <= type - 1; j += 1) {
            ctx.drawImage(
              img, j * width, i * height, width, height,
              0, 0, width, height,
            );
            results.push(resultCanvas.toDataURL());
          }
        }
        resolve(results);
      }, { once: true });
    });
  }

  public async getPostMediaInfo(src: string): Promise<IPostInfo> {
    const mediaInfo = await getMediaInfo(src);
    if (!mediaInfo || !mediaInfo.streams || !mediaInfo.format) throw new Error('No MediaInfo');
    const videoStream = mediaInfo.streams
      .find(val => val.codecType === 'video') as IVideoStream;
    if (!mediaInfo.format.size) throw new Error('No MediaInfo Size');
    if (!mediaInfo.format.duration) throw new Error('No MediaInfo Duration');
    const size = filesize(mediaInfo.format.size);
    const width = videoStream.width;
    const height = videoStream.height;
    const duration = mediaInfo.format.duration as number;
    const durationFmt = timecodeFromSeconds(duration, true);
    return {
      name: `${path.basename(src)}`,
      size,
      resolution: `${width} x ${height}`,
      durationFmt,
      duration,
    };
  }

  public async exportImage(el: HTMLElement, type: 3 | 4, savePath: string) {
    const val = await toJpeg(el, { quality: 0.5 });
    const imgPath = val.replace(/^data:image\/\w+;base64,/, '');
    if (/[.](jpg)$/.test(savePath) === false) savePath += '.jpg';
    writeFileSync(savePath, imgPath, 'base64');
  }
}

export const thumbnailPostService = new ThumbnailPostService();
