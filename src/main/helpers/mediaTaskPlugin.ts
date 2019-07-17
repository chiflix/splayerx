import { app, ipcMain, splayerx } from 'electron';
import { existsSync } from 'fs';

app.on('ready', () => {
  ipcMain.on('media-info-request', (event, path) => {
    if (existsSync(path)) {
      splayerx.getMediaInfo(path, info => event.reply('media-info-reply', undefined, info));
    } else event.reply('media-info-reply', new Error('File does not exist.'));
  });
  ipcMain.on('generate-thumbnail-request', (event,
    videoPath, imagePath,
    thumbnailWidth,
    rowThumbnailCount, columnThumbnailCount,
  ) => {
    if (existsSync(imagePath)) event.reply('generate-thumbnail-reply', undefined, imagePath);
    else if (videoPath) {
      splayerx.generateThumbnails(
        videoPath, imagePath,
        thumbnailWidth.toString(),
        rowThumbnailCount.toString(), columnThumbnailCount.toString(),
        (err) => {
          if (err) event.reply('generate-thumbnail-reply', new Error(err));
          else event.reply('generate-thumbnail-reply', imagePath);
        }
      )
    } else event.reply('generate-thumbnail-reply', new Error('File does not exist.'));
  });
});
