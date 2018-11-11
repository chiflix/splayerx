import { ipcRenderer } from 'electron'; //eslint-disable-line

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

export default function drag(element) {
  const mouseConstructor = getMouseConstructor();
  if (!mouseConstructor) return () => {};
  const mouse = mouseConstructor();
  let offset = null;
  const onmousedown = (e) => {
    offset = [e.clientX, e.clientY];
  };

  element.addEventListener('mousedown', onmousedown, true);

  mouse.on('left-drag', (x, y) => {
    if (!offset) return;

    x = Math.round(x - offset[0]);
    y = Math.round(y - offset[1]);

    ipcRenderer.send('callCurrentWindowMethod', 'setPosition', [x, y]);
  });

  mouse.on('left-up', () => {
    offset = null;
  });

  return () => {
    element.removeEventListener('mousedown', onmousedown);
    mouse.destroy();
  };
}
