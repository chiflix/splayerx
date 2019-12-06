import { ipcRenderer, remote } from 'electron'; //eslint-disable-line

function getRatio() {
  return window.devicePixelRatio || 1;
}

function parentsHasClass(element, className) {
  if (!element || !element.classList) { return false; }
  if (element.classList.contains(className)) { return true; }
  return parentsHasClass(element.parentNode, className);
}

export default function drag(element) {
  if (process.platform !== 'win32') return () => {};
  let offset = null;
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
  };

  element.addEventListener('mousedown', onmousedown, false);

  // 在windows系统下，正常情况win-mouse模块的left-up事件会正常触发，但是虚拟机下面
  // 有时会失效，导致拖动窗口，松开鼠标，应用窗口吸附的bug，通过mouseup，来释放拖拽
  const onmouseup = () => {
    offset = null;
  };
  element.addEventListener('mouseup', onmouseup, true);

  ipcRenderer.on('mouse-left-drag', (evt, x, y) => {
    if (!offset) return;
    x = Math.round((x / getRatio()) - offset[0]);
    y = Math.round((y / getRatio()) - offset[1]);
    ipcRenderer.send('callMainWindowMethod', 'setPosition', [x, y]);
  });

  ipcRenderer.on('mouse-left-up', () => {
    offset = null;
  });

  return () => {
    element.removeEventListener('mousedown', onmousedown);
    element.removeEventListener('mouseup', onmouseup);
  };
}
