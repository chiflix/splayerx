import { ipcMain, default as electron } from 'electron'; //eslint-disable-line
export default class WindowResize {
  constructor(win) {
    this.win = win;
    this.electron = electron;
    this.ratio = null;
    this.width = null;
    this.height = null;
    this.type = null;
    this.ipc = ipcMain;
    this.ready = false;
    this.status = 'idle';
    this.goBackTime = 200;
    this.timeStamp = new Date();
    this.counter = 0;
    this.c0 = 16; // corner length for other corners
    this.c1 = 4; // corner length for left/right - bottom
  }
  onStart() {
    if (process.platform === 'win32') { this.registerMessage(); }
  }
    onResize() { // eslint-disable-line
    if (!this.ready) return;
    switch (this.status) {
      case 'idle':
        this.type = this.changeType();
        if (!this.type) return;
        if (this.type === 'corner') {
          this.status = 'corner';
        } else {
          this.status = 'resize_WH';
        }
        this.goBackToIdleTimer();
        break;
      case 'resize_WH':
        if (!this.pickOneInTwo()) return;
        this.goBackToIdleTimer();
        this.update();
        this.win.setSize(this.width, this.height);
        break;
      case 'corner':
        this.update();
        this.goBackToIdleTimer();
        break;
      default:
    }
  }
  registerMessage() {
    this.win.on('resize', () => {
      this.onResize();
    });
    this.ipc.on('main-setNewWindowSize', (event, args) => { this.onSetNewWindowSize(args); });
    this.ipc.on('main-reset-size-listener', () => { this.onReset(); });
  }
  onReset() {
    this.ratio = null;
    this.width = null;
    this.height = null;
    this.type = null;
    this.ready = false;
  }
  onSetNewWindowSize(arg) { // eslint-disable-line
    if (arg) {
      this.width = arg.width;
      this.height = arg.height;
      this.ratio = this.calcRatio();
    } else {
      this.width = this.win.getBounds().width;
      this.height = this.win.getBounds().height;
      this.ratio = this.calcRatio();
    }
    this.ready = true;
  }
  goBackToIdleTimer() {
    // will first change timestamp then other settimeout will be
    // disabled when atempting to change status to idle
    const timeStamp = new Date();
    this.timeStamp = timeStamp;
    setTimeout(() => {
      this.changeStatusIfLatest(timeStamp);
    }, this.goBackTime);
  }
  calcRatio() {
    return this.height / this.width;
  }
  pickOneInTwo() {
    this.counter += 1;
    this.counter %= 2;
    if (this.counter === 1) {
      return true;
    }
    return false;
  }
  update() {
    if (this.type) {
      if (this.type === 'width') {
        this.width = this.win.getSize()[0]; //eslint-disable-line
        this.height = Math.ceil(this.width * this.ratio);
      } else if (this.type === 'height') {
        this.height = this.win.getSize()[1];  //eslint-disable-line
        this.width = Math.ceil(this.height / this.ratio);
      } else {
        this.width = this.win.getSize()[0]; //eslint-disable-line
        this.height = this.win.getSize()[1]; //eslint-disable-line
      }
    }
  }
  changeType() {
    const bound = this.win.getBounds();
    let typeNumber = 0;
    const cp = this.electron.screen.getCursorScreenPoint();
    const x1 = bound.x + this.c0;
    const x2 = (bound.x + bound.width) - this.c0;
    const y1 = bound.y + this.c0;
    const y2 = (bound.y - this.c1) + bound.height;
    if (x1 < cp.x && cp.x < x2) {
      typeNumber += 1;
    }
    if (y1 < cp.y && cp.y < y2) {
      typeNumber += 2;
    }
    switch (typeNumber) {
      case 0:
        return 'corner';
      case 2:
        return 'width';
      case 1:
        return 'height';
      default:
        return null;
    }
  }
  changeStatusIfLatest(timeStamp, status = 'idle') {
    if (timeStamp >= this.timeStamp) {
      this.status = status;
    }
  }
}
