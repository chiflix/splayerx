/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line no-console
const { ipcRenderer, remote } = require('electron');
const geoip = require('geoip-lite');

window.lookup = ip => geoip.lookup(ip);

window.isDarwin = process.platform === 'darwin';

window.ipcRenderer = ipcRenderer;

window.remote = remote;

window.displayLanguage = remote.app.getDisplayLanguage();
