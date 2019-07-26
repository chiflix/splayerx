import {
  app, ipcMain, splayerx, Event,
} from 'electron';
import { existsSync } from 'fs';

function reply(event: Event, channel: string, ...args: any[]) {
  if (event.sender && !event.sender.isDestroyed()) event.reply(channel, ...args);
}

app.on('ready', () => {
  ipcMain.on('media-info-request', (event, path) => {
    if (existsSync(path)) {
      splayerx.getMediaInfo(path, info => reply(event, 'media-info-reply', undefined, info));
    } else reply(event, 'media-info-reply', new Error('File does not exist.'));
  });
  ipcMain.on('snapshot-request', (event,
    videoPath, imagePath,
    timeString,
    width, height) => {
    if (existsSync(imagePath)) reply(event, 'snapshot-reply', undefined, imagePath);
    else if (existsSync(videoPath)) {
      splayerx.snapshotVideo(
        videoPath, imagePath,
        timeString,
        width.toString(), height.toString(),
        (err) => {
          if (err === '0' && existsSync(imagePath)) reply(event, 'snapshot-reply', undefined, imagePath);
          else reply(event, 'snapshot-reply', new Error(err));
        },
      );
    } else reply(event, 'snapshot-reply', new Error('File does not exist.'));
  });
  ipcMain.on('subtitle-request', (event,
    videoPath, subtitlePath,
    streamIndex) => {
    if (existsSync(subtitlePath)) reply(event, 'subtitle-reply', undefined, subtitlePath);
    else if (existsSync(videoPath)) {
      splayerx.extractSubtitles(
        videoPath, subtitlePath,
        streamIndex,
        (err) => {
          if (err === '0' && existsSync(subtitlePath)) reply(event, 'subtitle-reply', undefined, subtitlePath);
          else reply(event, 'subtitle-reply', new Error(err));
        },
      );
    } else reply(event, 'subtitle-reply', new Error('File does not exist.'));
  });
  ipcMain.on('thumbnail-request', (event,
    videoPath, imagePath,
    thumbnailWidth,
    rowThumbnailCount, columnThumbnailCount) => {
    if (existsSync(imagePath)) reply(event, 'thumbnail-reply', undefined, imagePath);
    else if (existsSync(videoPath)) {
      splayerx.generateThumbnails(
        videoPath, imagePath,
        thumbnailWidth.toString(),
        rowThumbnailCount.toString(), columnThumbnailCount.toString(),
        (err) => {
          if (err === '0' && existsSync(imagePath)) reply(event, 'thumbnail-reply', undefined, imagePath);
          else reply(event, 'thumbnail-reply', new Error(err));
        },
      );
    } else reply(event, 'thumbnail-reply', new Error('File does not exist.'));
  });
});
