/* eslint-disable @typescript-eslint/no-var-requires */
console.log('preloaded~~~~~~~');
const { ipcRenderer, remote } = require('electron');
const mouse = process.platform === 'win32' ? require('win-mouse')() : null;

let mousedown = false;
let isDragging = false;
let mousedownPos = null;
let windowSize = null;
function sendToHost(channel, message) {
  ipcRenderer.sendToHost(channel, message);
}
function getRatio() {
  return window.devicePixelRatio || 1;
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('mousedown', (evt) => {
    mousedown = true;
    mousedownPos = [evt.clientX, evt.clientY];
    if (getRatio() !== 1) {
      windowSize = remote.getCurrentWindow().getSize();
    }
  }, true);
  window.addEventListener('mouseup', (evt) => {
    mousedown = false;
    mousedownPos = null;
    windowSize = null;
    if (isDragging) evt.stopImmediatePropagation();
  }, true);
  if (mouse) {
    mouse.on('left-drag', (x, y) => {
      sendToHost('mousemove', 'isMoving');
      isDragging = true;
      if (mousedownPos) {
        sendToHost('left-drag', {
          windowSize,
          x: Math.round(x / getRatio() - mousedownPos[0]),
          y: Math.round(y / getRatio() - mousedownPos[1]),
        });
      }
    });
  }
  window.addEventListener('mousemove', (evt) => {
    sendToHost('mousemove', 'isMoving');
    if (mousedown) isDragging = true;
  }, true);
  window.addEventListener('click', (evt) => {
    if (isDragging) evt.stopImmediatePropagation();
    isDragging = false;
    mousedownPos = null;
    windowSize = null;
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
  document.addEventListener('fullscreenchange', () => {
    sendToHost('fullscreenchange', { isFullScreen: document.webkitIsFullScreen });
  });
});

// Some websites intercept links to open a blank window, then set its location, e.g. iqiyi.com
const originWindowOpen = window.open.bind(window);
window.open = function customWindowOpen(url, ...rest) {
  if (url !== 'about:blank') return originWindowOpen(url, ...rest);
  return {
    set location(url) {
      if (url && url !== 'about:blank') originWindowOpen(url);
    },
  };
};
