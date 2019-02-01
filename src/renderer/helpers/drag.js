import { ipcRenderer, remote } from 'electron'; //eslint-disable-line

let mouseConstructor = null;
const isWin32 = process.platform === 'win32'; // judge which system

function getMouseConstructor() {
  if (mouseConstructor) return mouseConstructor;
  try {
    if (isWin32) {
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
  if (!mouseConstructor) return () => { };
  const mouse = mouseConstructor();
  let offset = null;
  let windowSize = null;
  const onmousedown = (e) => {
    // In WebKit、Gecko which property in MouseEvent can judge if right click
    // In IE can use button property in MouseEvent
    // 当在windows系统下面，右键窗口会打开目录，同时也会执行mousedown
    // 在mousedown内部判断e.which是否为rightClick，来过滤这些事件
    if (e && e.which === 3) return;
    if (parentsHasClass(e.target, 'no-drag')) {
      offset = null;
    } else {
      offset = [e.clientX, e.clientY];
    }
    if (getRatio() !== 1) {
      windowSize = remote.getCurrentWindow().getSize();
    }
  };

  element.addEventListener('mousedown', onmousedown, false);

  // 在windows系统下，正常情况win-mouse模块的left-up事件会正常触发，但是虚拟机下面
  // 有时会失效，导致拖动窗口，松开鼠标，应用窗口吸附的bug，通过mouseup，来释放拖拽
  if (isWin32) {
    element.addEventListener('mouseup', () => {
      offset = null;
      windowSize = null;
    }, true);
  }

  mouse.on('left-drag', (x, y) => {
    if (!offset) return;
    x = Math.round((x / getRatio()) - offset[0]);
    y = Math.round((y / getRatio()) - offset[1]);
    if (windowSize) {
      ipcRenderer.send('callMainWindowMethod', 'setBounds', [{
        x, y, width: windowSize[0], height: windowSize[1],
      }]);
    } else {
      ipcRenderer.send('callMainWindowMethod', 'setPosition', [x, y]);
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
