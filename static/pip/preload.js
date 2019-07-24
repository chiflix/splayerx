console.log('preloaded~~~~~~~');
const { ipcRenderer } = require('electron');
let mousedown = false;
let isDragging = false;
function sendToHost(channel, message) {
  ipcRenderer.sendToHost(channel, message);
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('mousedown', (evt) => {
    mousedown = true;
  }, true);
  window.addEventListener('mouseup', (evt) => {
    mousedown = false;
    if (isDragging) evt.stopImmediatePropagation();
  }, true);
  window.addEventListener('mousemove', (evt) => {
    sendToHost('mousemove', 'isMoving');
    if (mousedown) isDragging = true;
  }, true);
  window.addEventListener('click', (evt) => {
    if (isDragging) evt.stopImmediatePropagation();
    isDragging = false;
  }, true);
  window.addEventListener('drop', (evt) => {
    evt.preventDefault();
    const files = Array.prototype.map.call(evt.dataTransfer.files, f => f.path);
    sendToHost('drop', { files });
  });
  window.addEventListener('dragover', (evt) => {
    evt.preventDefault();
    sendToHost('dragover', { dragover: true });
  });
  window.addEventListener('dragleave', (evt) => {
    evt.preventDefault();
    sendToHost('dragleave', { dragover: false });
  });
  window.addEventListener('keydown', (evt) => {
    if (document.webkitIsFullScreen && evt.keyCode === 27) {
      document.webkitCancelFullScreen();
    }
  });
});
