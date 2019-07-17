import { app, ipcMain, splayerx } from 'electron';
import { existsSync } from 'fs';

app.on('ready', () => {
  ipcMain.on('media-info-request', (event, path) => {
    if (existsSync(path)) {
      splayerx.getMediaInfo(path, info => event.reply('media-info-reply', undefined, info));
    } else event.reply('media-info-reply', new Error('File does not exist.'));
  });
});
