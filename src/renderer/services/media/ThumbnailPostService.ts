import { writeFileSync } from 'fs';
import path from 'path';
import { toPng } from 'html-to-image';
import { getThumbnailPath } from '@/plugins/mediaTasks';
import { getMediaInfo } from '@/plugins/mediaTasks/index';
import { timecodeFromSeconds } from '@/libs/utils';
import { IVideoStream } from '@/plugins/mediaTasks/mediaInfoQueue';

export default class ThumbnailPostService {
  public async getPostPng(src: string, duration: number): Promise<string> {
    const interval = Math.ceil(duration / 10);
    const width = 380;
    const col = 3;
    const thumbnail = await getThumbnailPath(src, interval, width, col)
    const img = new Image();
    img.src = `file://${thumbnail.imgPath}`;
    return new Promise((resolve) => {
      img.addEventListener('load', () => {
        const height = img.height / 4;
        const resultCanvas = document.createElement('canvas');
        resultCanvas.setAttribute('width', `${(width * 3) + 120}px`);
        resultCanvas.setAttribute('height', `${(height * 3) + 120}px`);
        const ctx = resultCanvas.getContext('2d');
        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
        for (let i = 0; i <= 2; i += 1) {
          for (let j = 0; j <= 2; j += 1) {
            ctx.drawImage(
              img, j * width, i * height, width, height,
              60 + j * (width + 10), 60 + i * (height + 10), width, height,
            );
          }
        }
        const imgDataUrl = resultCanvas.toDataURL();
        // const imgPath = imgDataUrl.replace(/^data:image\/\w+;base64/, '');
        // writeFileSync(path.join(__static, 'cbd.png'), imgPath, 'base64');
        resolve(imgDataUrl);
      }, { once: true });
    });
  }

  public async getPostMediaInfo(src: string) {
    const mediaInfo = await getMediaInfo(src);
    const videoStream = mediaInfo.streams.find(val => val.codecType === 'video') as IVideoStream;
    console.log('mediaInffo', videoStream);
    console.log('width', videoStream.width);
    console.log('height', videoStream.height);
    console.log('duration', timecodeFromSeconds(videoStream.duration));
  }
}

export const thumbnailPostService = new ThumbnailPostService();