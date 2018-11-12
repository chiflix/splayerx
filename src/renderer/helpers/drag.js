import { ipcRenderer, remote } from 'electron'; //eslint-disable-line

let mouseConstructor = null;

function getMouseConstructor() {
  if (mouseConstructor) return mouseConstructor;
  try {
    if (process.platform === 'win32') {
      mouseConstructor = require('win-mouse'); //eslint-disable-line
    }
    return mouseConstructor;
  } catch (ex) {
    console.error(ex);
    return null;
  }
}

function getRatio() {
  return window.devicePixelRatio || 1;
}

function parentsHasClass(element, className) {
  if (!element || !element.classList) { return false; }
  if (element.classList.contains(className)) { return true; }
  return parentsHasClass(element.parentNode, className);
}

export default function drag(element) {
  const mouseConstructor = getMouseConstructor();
  if (!mouseConstructor) return () => {};
  const mouse = mouseConstructor();
  let offset = null;
  let windowSize = null;
  const onmousedown = (e) => {
    if (parentsHasClass(e.target, 'no-drag')) {
      offset = null;
    } else {
      offset = [e.clientX, e.clientY];
    }
    if (getRatio() !== 1) {
      windowSize = remote.getCurrentWindow().getSize();
    }
  };

  element.addEventListener('mousedown', onmousedown, true);

  mouse.on('left-drag', (x, y) => {
    if (!offset) return;
    x = Math.round((x / getRatio()) - offset[0]);
    y = Math.round((y / getRatio()) - offset[1]);
    ipcRenderer.send('callCurrentWindowMethod', 'setPosition', [x, y]);
    if (windowSize) {
      ipcRenderer.send('callCurrentWindowMethod', 'setSize', windowSize);
    }
  });

  mouse.on('left-up', () => {
    offset = null;
    windowSize = null;
  });

  return () => {
    element.removeEventListener('mousedown', onmousedown);
    mouse.destroy();
  };
}
