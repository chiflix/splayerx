import { ipcMain, splayerx, Event } from 'electron';
import { existsSync } from 'fs';
import { writeFile } from 'fs-extra';

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
              reply(event, 'snapshot-reply', err);
            }
          }, 5);
        },
      );
    } else {
      reply(event, 'snapshot-reply', 'File does not exist.');
    }
  });

  let lastVideoPath = '';
  let lastStreamIndex = -1;
  let subtitleText = '';
  let lastSubtitlePos = 0;
  ipcMain.on('subtitle-request', (event,
    videoPath, subtitlePath,
    streamIndex) => {
    if (existsSync(subtitlePath)) reply(event, 'subtitle-reply', undefined, true, subtitlePath);
    else if (existsSync(videoPath)) {
      if (videoPath !== lastVideoPath || lastStreamIndex !== streamIndex) {
        lastVideoPath = videoPath;
        lastStreamIndex = streamIndex;
        subtitleText = '';
        lastSubtitlePos = 0;
      }
      splayerx.extractSubtitles(
        videoPath,
        streamIndex,
        lastSubtitlePos,
        false,
        20,
        (error, position, data) => {
          if (error && error !== 'EOF') reply(event, 'subtitle-reply', new Error(error));
          else if (!error) {
            const stringToBeConcated = data ? data.toString('utf8') : '';
            subtitleText = subtitleText.concat(stringToBeConcated);
            lastSubtitlePos = position;
            reply(event, 'subtitle-reply', undefined, false);
          } else {
            writeFile(subtitlePath, subtitleText, { encoding: 'utf8' })
              .then(() => reply(event, 'subtitle-reply', undefined, true, subtitlePath));
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
      reply(event, 'thumbnail-reply', null, imagePath);
    } else if (existsSync(videoPath)) {
      splayerxProxy.generateThumbnails(
        videoPath, imagePath,
        thumbnailWidth.toString(),
        rowThumbnailCount.toString(), columnThumbnailCount.toString(),
        (err) => {
          if (err === '0' && existsSync(imagePath)) reply(event, 'thumbnail-reply', null, imagePath);
          else reply(event, 'thumbnail-reply', err);
        },
      );
    } else {
      reply(event, 'thumbnail-reply', 'File does not exist.');
    }
  });
}
