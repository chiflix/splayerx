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
      downloadBtn.textContent = '请稍后';
      sendToHost('download-video', {
        id, name, path, ext, url,
      });
    });
  }
  if (folder) {
    folder.addEventListener('click', () => {
      const title = document.querySelector('.name-content').value;
      const path = document.querySelector('.folder-content').children[0].textContent;
      sendToHost('open-download-folder', { title, path });
    });
  }
});
