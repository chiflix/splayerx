import { ipcMain } from 'electron'; //eslint-disable-line
export default class WindowResize {
  constructor(win) {
    this.win = win;
    this.ratio = null;
    this.width = null;
    this.height = null;
    this.type = null;
    this.ipc = ipcMain;
    this.ready = false;
    this.status = 'idle';
    this.goBackTime = 200;
    this.goBack = false;
    this.timeStamp = new Date();
  }
  onStart() {
    if (process.platform === 'win32') { this.registerMessage(); }
  }
    onResize() { // eslint-disable-line
    if (!this.ready) return;
    this.goBack = false;
    switch (this.status) {
      case 'idle':
        this.type = this.changeType();
        if (!this.type) {
          this.status = 'idle';
          return;
        }
        this.status = 'resize1';
        this.goBackToIdleTimer();
        break;
      case 'resize1':
        this.goBackToIdleTimer();
        this.update();
        this.win.setSize(this.width, this.height);
        break;
      default:
    }
  }
  registerMessage() {
    this.win.on('resize', () => {
      this.onResize();
    });
    this.ipc.on('main-setNewWindowSize', () => { this.onSetNewWindowSize(); });
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
    this.goBack = true;
    setTimeout(() => {
      if (this.goBack) {
        this.changeStatusIfLatest(timeStamp);
      }
    }, this.goBackTime);
  }
  calcRatio() {
    return this.height / this.width;
  }
  update() {
    if (this.type) {
      if (this.type === 'width') {
        this.width = this.win.getSize()[0]; //eslint-disable-line
        this.height = Math.ceil(this.width * this.ratio);
      } else {
        this.height = this.win.getSize()[1];  //eslint-disable-line
        this.width = Math.ceil(this.height / this.ratio);
      }
    }
  }
  changeType() {
    // if changed together
    const widthNow = this.win.getSize()[0];
    const heightNow = this.win.getSize()[1];
    if (widthNow !== this.width && heightNow !== this.height) {
      return null;
    }
    const sumOfBefore = this.width + this.height;
    const sumOfNow = widthNow + heightNow;
    if (sumOfBefore < sumOfNow) {
      if (this.width < widthNow) {
        return 'width';
      }
      return 'height';
    } else if (this.width > widthNow) {
      return 'width';
    }
    return 'height';
  }
  changeStatusIfLatest(timeStamp, status = 'idle') {
    if (timeStamp >= this.timeStamp) {
      this.status = status;
    }
  }
}
