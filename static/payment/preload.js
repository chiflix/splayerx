/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line no-console
const { ipcRenderer } = require('electron');

window.notifyTimeout = () => {
  ipcRenderer.send('payment-fail');
};
