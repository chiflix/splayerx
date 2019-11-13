import { writeFileSync } from 'fs';
import path from 'path';
import { toPng } from 'html-to-image';
import { getThumbnailPath } from '@/plugins/mediaTasks';
import { getMediaInfo } from '@/plugins/mediaTasks/index';
import { timecodeFromSeconds } from '@/libs/utils';
import { IVideoStream } from '@/plugins/mediaTasks/mediaInfoQueue';
import filesize from 'filesize';

interface IPostInfo {
  name: string;
  details: string;
  duration: number;
  durationFmt: string;
}

export default class ThumbnailPostService {
  public async getPostPng(src: string, duration: number): Promise<string[]> {
    const interval = Math.ceil(duration / 10);
    const width = 380;
    const col = 3;
    const thumbnail = await getThumbnailPath(src, interval, width, col);
    if (!thumbnail) throw new Error('No Thumbnail');
    const results: string[] = [];
    const img = new Image();
    img.src = `file://${thumbnail.imgPath}`;
    return new Promise((resolve) => {
      img.addEventListener('load', () => {
        const height = img.height / 4;
        const resultCanvas = document.createElement('canvas');
        resultCanvas.setAttribute('width', `${width}}px`);
        resultCanvas.setAttribute('height', `${height}px`);
        const ctx = resultCanvas.getContext('2d') as CanvasRenderingContext2D;
        for (let i = 0; i <= 2; i += 1) {
          for (let j = 0; j <= 2; j += 1) {
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
    return {
      name: `${path.basename(src)}`,
      details: `${size}   ${width} * ${height}   ${duration}`,
      durationFmt: timecodeFromSeconds(duration),
      duration,
    };
  }

  public async exportPng(el: HTMLElement) {
    toPng(el).then((val) => {
      const imgPath = val.replace(/^data:image\/\w+;base64,/, '');
      writeFileSync(path.join(__static, 'abc.png'), imgPath, 'base64');
    });
  }
}

export const thumbnailPostService = new ThumbnailPostService();
