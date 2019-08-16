// eslint-disable-next-line no-console
console.log('titlebar-preloaded~~~~~~~');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ipcRenderer, remote } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  const close = document.querySelector('.titlebarClose');
  const min = document.querySelector('.titlebarMin');
  const full = document.querySelector('.titlebarFull');
  const recover = document.querySelector('.titlebarRecover');
  if (close) {
    close.addEventListener('mouseup', () => ipcRenderer.send('mouseup', 'close'));
  }
  if (min) {
    min.addEventListener('mouseup', () => ipcRenderer.send('mouseup', 'min'));
  }
  if (full) {
    full.addEventListener('mouseup', () => ipcRenderer.send('mouseup', 'full'));
  }
  if (recover) {
    recover.addEventListener('mouseup', () => ipcRenderer.send('mouseup', 'recover'));
  }
});
