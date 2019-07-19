import { app, ipcMain, splayerx } from 'electron';
import { existsSync } from 'fs';

app.on('ready', () => {
  ipcMain.on('media-info-request', (event, path) => {
    if (existsSync(path)) {
      splayerx.getMediaInfo(path, info => event.reply('media-info-reply', undefined, info));
    } else event.reply('media-info-reply', new Error('File does not exist.'));
  });
  ipcMain.on('snapshot-request', (event,
    videoPath, imagePath,
    timeString,
    width, height) => {
    if (existsSync(imagePath)) event.reply('snapshot-reply', undefined, imagePath);
    else if (existsSync(videoPath)) {
      splayerx.snapshotVideo(
        videoPath, imagePath,
        timeString,
        width.toString(), height.toString(),
        (err) => {
          if (err === '0' && existsSync(imagePath)) event.reply('snapshot-reply', undefined, imagePath);
          else event.reply('snapshot-reply', new Error(err));
        },
      );
    } else event.reply('snapshot-reply', new Error('File does not exist.'));
  });
  ipcMain.on('subtitle-request', (event,
    videoPath, subtitlePath,
    streamIndex) => {
    if (existsSync(subtitlePath)) event.reply('subtitle-reply', undefined, subtitlePath);
    else if (existsSync(videoPath)) {
      splayerx.extractSubtitles(
        videoPath, subtitlePath,
        streamIndex,
        (err) => {
          if (err === '0' && existsSync(subtitlePath)) event.reply('subtitle-reply', undefined, subtitlePath);
          else event.reply('subtitle-reply', new Error(err));
        },
      );
    } else event.reply('subtitle-reply', new Error('File does not exist.'));
  });
  ipcMain.on('thumbnail-request', (event,
    videoPath, imagePath,
    thumbnailWidth,
    rowThumbnailCount, columnThumbnailCount) => {
    if (existsSync(imagePath)) event.reply('thumbnail-reply', undefined, imagePath);
    else if (existsSync(videoPath)) {
      splayerx.generateThumbnails(
        videoPath, imagePath,
        thumbnailWidth.toString(),
        rowThumbnailCount.toString(), columnThumbnailCount.toString(),
        (err) => {
          if (err === '0' && existsSync(imagePath)) event.reply('thumbnail-reply', undefined, imagePath);
          else event.reply('thumbnail-reply', new Error(err));
        },
      );
    } else event.reply('thumbnail-reply', new Error('File does not exist.'));
  });
});
