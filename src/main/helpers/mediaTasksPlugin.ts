import { ipcMain, splayerx, Event } from 'electron';
import { existsSync } from 'fs';

function reply(event: Event, channel: string, ...args: unknown[]) {
  if (event.sender && !event.sender.isDestroyed()) event.reply(channel, ...args);
}

/**
 * Proxied splayerx module to prevent main process crash
 */
const splayerxProxy = new Proxy(splayerx, {
  get(obj, prop) {
    if (!(prop in obj)) return undefined;
    const originMember = obj[prop];
    if (typeof originMember === 'function') {
      const proxiedFunction = function proxiedFunction(...args: unknown[]) {
        try {
          return originMember.apply(obj, args);
        } catch (ex) {
          console.error(ex, prop, args);
          return undefined;
        }
      };
      return proxiedFunction.bind(obj);
    }
    return originMember;
  },
});

export default function registerMediaTasks() {
  ipcMain.on('media-info-request', (event, path) => {
    if (existsSync(path)) {
      splayerxProxy.getMediaInfo(path, info => reply(event, 'media-info-reply', null, info));
    } else {
      reply(event, 'media-info-reply', 'File does not exist.');
    }
  });
  ipcMain.on('snapshot-request', (event,
    videoPath, imagePath,
    timeString,
    width, height) => {
    if (existsSync(imagePath)) {
      reply(event, 'snapshot-reply', null, imagePath);
    } else if (existsSync(videoPath)) {
      splayerxProxy.snapshotVideo(
        videoPath, imagePath,
        timeString,
        width.toString(), height.toString(),
        (err) => {
          setTimeout(() => { // fix "Waiting for the task completion." from electron.splayerx
            if (err === '0' && existsSync(imagePath)) {
              reply(event, 'snapshot-reply', null, imagePath);
            } else {
              if (typeof err !== 'string') err = `${err}, type: ${typeof err}`;
              reply(event, 'snapshot-reply', `snapshot-reply: ${err}`);
            }
          }, 5);
        },
      );
    } else {
      reply(event, 'snapshot-reply', 'File does not exist.');
    }
  });
  ipcMain.on('subtitle-request', (event, videoPath, subtitlePath, streamIndex) => {
    if (existsSync(subtitlePath)) {
      reply(event, 'subtitle-reply', null, subtitlePath);
    } else if (existsSync(videoPath)) {
      splayerxProxy.extractSubtitles(
        videoPath, subtitlePath,
        streamIndex,
        (err) => {
          if (err === '0' && existsSync(subtitlePath)) {
            reply(event, 'subtitle-reply', null, subtitlePath);
          } else {
            if (typeof err !== 'string') err = `${err}, type: ${typeof err}`;
            reply(event, 'subtitle-reply', `subtitle-reply: ${err}`);
          }
        },
      );
    } else {
      reply(event, 'subtitle-reply', 'File does not exist.');
    }
  });
  ipcMain.on('thumbnail-request', (event,
    videoPath, imagePath,
    thumbnailWidth,
    rowThumbnailCount, columnThumbnailCount) => {
    if (existsSync(imagePath)) {
      reply(event, 'thumbnail-reply', null, imagePath, videoPath);
    } else if (existsSync(videoPath)) {
      splayerxProxy.generateThumbnails(
        videoPath, imagePath,
        thumbnailWidth.toString(),
        rowThumbnailCount.toString(), columnThumbnailCount.toString(),
        (err) => {
          if (err === '0' && existsSync(imagePath)) {
            reply(event, 'thumbnail-reply', null, imagePath, videoPath);
          } else {
            if (typeof err !== 'string') err = `${err}, type: ${typeof err}`;
            reply(event, 'thumbnail-reply', `thumbnail-reply: ${err}`);
          }
        },
      );
    } else {
      reply(event, 'thumbnail-reply', 'File does not exist.');
    }
  });
}
