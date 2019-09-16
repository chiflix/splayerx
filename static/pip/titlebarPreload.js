// eslint-disable-next-line no-console
console.log('titlebar-preloaded~~~~~~~');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ipcRenderer, remote } = require('electron');
const isDarwin = process.platform === 'darwin';
let offset = null;
let windowSize = null;
let pipTimer = null;
function getRatio() {
  return window.devicePixelRatio || 1;
}
document.addEventListener('DOMContentLoaded', () => {
  const titlebar = document.querySelector('.titlebar');
  const content = document.querySelector('.content');
  const close = document.querySelector('.titlebarClose');
  const min = document.querySelector('.titlebarMin');
  const full = document.querySelector('.titlebarFull');
  const recover = document.querySelector('.titlebarRecover');
  const unmax = document.querySelector('.titlebarUnMax');
  const max = document.querySelector('.titlebarMax');
  if (titlebar) {
    titlebar.addEventListener('dblclick', () => ipcRenderer.send('mouseup', 'max'));
    titlebar.style.visibility = 'visible';
    titlebar.addEventListener('mousemove', () => {
      if (pipTimer) clearTimeout(pipTimer);
      ipcRenderer.send('pip-btn-mousemove');
      titlebar.style.visibility = 'visible';
    });
    pipTimer = setTimeout(() => {
      titlebar.style.visibility = 'hidden';
    }, 3000);
  }
  if (isDarwin) {
    let mouseenter = false;

    if (content) {
      document.addEventListener('keydown', (e) => {
        const fullScreen = recover.style.display === 'block';
        if (e.keyCode === 18 && mouseenter && !fullScreen) {
          ipcRenderer.send('maximizable', true);
        }
      });
      document.addEventListener('keyup', () => {
        const fullScreen = recover.style.display === 'block';
        if (!fullScreen) {
          ipcRenderer.send('maximizable', false);
        }
      });
      content.addEventListener('mouseenter', (e) => {
        mouseenter = true;
        remote.getCurrentWindow().getBrowserViews()[2].webContents.focus();
        const fullScreen = recover.style.display === 'block';
        close.src = 'assets/titleBarClose-hover-icon.svg';
        if (!fullScreen) {
          if (e.altKey) {
            full.style.display = 'none';
            max.style.display = 'block';
          }
          min.src = 'assets/titleBarExitFull-hover-icon.svg';
          full.src = 'assets/titleBarFull-hover-icon.svg';
        } else {
          recover.src = 'assets/titlebarRecover-hover-icon.svg';
        }
      });
      content.addEventListener('mouseleave', () => {
        mouseenter = false;
        const fullScreen = recover.style.display === 'block';
        close.src = 'assets/titleBarClose-default-icon.svg';
        min.src = 'assets/titleBarExitFull-default-icon.svg';
        if (!fullScreen) {
          full.src = 'assets/titleBarFull-default-icon.svg';
          full.style.display = 'block';
          max.style.display = 'none';
        } else {
          recover.src = 'assets/titlebarRecover-default-icon.svg';
        }
      });
    }
  }
  window.addEventListener('mousedown', (evt) => {
    offset = [evt.clientX, evt.clientY];
    if (getRatio() !== 1) {
      windowSize = remote.getCurrentWindow().getSize();
    }
    if ([content, titlebar].includes(evt.target)) ipcRenderer.send('update-mouse-info', { offset, windowSize });
  }, true);
  window.addEventListener('mouseup', () => {
    offset = null;
    windowSize = null;
    ipcRenderer.send('update-mouse-info', { offset, windowSize });
  });
  window.addEventListener('keydown', (e) => {
    ipcRenderer.send('key-events', e.keyCode);
  });
  window.addEventListener('mouseout', (e) => {
    const winSize = remote.getCurrentWindow().getSize();
    if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= winSize[0]) {
      ipcRenderer.send('mouseout', 'out');
    }
  });
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
  if (max) {
    max.addEventListener('mouseup', () => ipcRenderer.send('mouseup', 'max'));
  }
  if (unmax) {
    unmax.addEventListener('mouseup', () => ipcRenderer.send('mouseup', 'unmax'));
  }
});
