/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line no-console
console.log('download preloaded~~~~~~~');
const { ipcRenderer, remote } = require('electron');
function sendToHost(channel, message) {
  ipcRenderer.send(channel, message);
}

document.addEventListener('DOMContentLoaded', () => {
  const cancelBtn = document.querySelector('.cancel');
  const downloadBtn = document.querySelector('.download');
  const folder = document.querySelector('.folder-content');
  const footer = document.querySelector('.footer');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      sendToHost('close-download-list');
    });
  }
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const id = document.querySelector('.selected-item').getAttribute('selectedId');
      const name = document.querySelector('.name-content').value;
      const path = document.querySelector('.folder-content').children[0].textContent;
      const ext = document.querySelector('.selected-item').getAttribute('ext');
      const url = document.querySelector('.selected-item').getAttribute('download-url');
      const resolution = parseInt(document.querySelector('.selected-item > span').textContent, 10);
      document.querySelector('.download').style.pointerEventst = 'none';
      ipcRenderer.sendTo(remote.getCurrentWindow().webContents.id, 'store-download-info', { resolution, path });
      sendToHost('download-video', {
        id, name, path, ext, url,
      });
    });
  }
  if (folder) {
    folder.addEventListener('click', () => {
      const title = document.querySelector('.name-content').value;
      const path = document.querySelector('.folder-content').children[0].textContent;
      document.querySelector('.folder-content').style.borderColor = '#FA6400';
      document.querySelector('.folder-content > img').src = 'assets/fileSave-active-icon.svg';
      sendToHost('open-download-folder', { title, path });
    });
  }
  if (footer) {
    footer.addEventListener('click', () => sendToHost('add-preference', 'premium'));
  }
  window.addEventListener('keydown', (e) => {
    if ([67, 79, 80].includes(e.keyCode) && e.target.tagName === 'INPUT') {
      ipcRenderer.sendTo(remote.getCurrentWindow().webContents.id, 'keydown');
    }
  });
});
