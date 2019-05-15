console.log('preloaded~~~~~~~');
const { ipcRenderer } = require('electron');

function sendToHost(channel, message) {
  ipcRenderer.sendToHost(channel, message);
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('scroll', (evt) => {
    sendToHost('scroll', { windowScrollY: window.scrollY });
  }, true);
});
