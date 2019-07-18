console.log('preloaded~~~~~~~');
const { ipcRenderer } = require('electron');
let mousedown = false;
function sendToHost(channel, message) {
  ipcRenderer.sendToHost(channel, message);
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('scroll', (evt) => {
    sendToHost('scroll', { windowScrollY: window.scrollY });
  }, true);
  window.addEventListener('mousedown', (evt) => {
    mousedown = true;
  }, true);
  window.addEventListener('mousemove', (evt) => {
    sendToHost('mousemove', { isDragging: mousedown });
  }, true);
  window.addEventListener('mouseup', (evt) => {
    mousedown = false;
  }, true);
});
