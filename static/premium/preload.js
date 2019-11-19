/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line no-console
const { ipcRenderer, remote, clipboard } = require('electron');

window.isDarwin = process.platform === 'darwin';

window.isMAS = process.mas;

window.ipcRenderer = ipcRenderer;

window.remote = remote;

window.displayLanguage = remote.app.getDisplayLanguage();

window.clipboard = clipboard;
