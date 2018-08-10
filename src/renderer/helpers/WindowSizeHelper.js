export class WindowSizeHelper {
  constructor(vue) {
    this.vue = vue;
    console.log('lyc here');
  }
  setNewWindowSize(arg) {
    this.vue.$bus.$emit('main-setNewWindowSize', arg);
  }
  resetListener() {
    this.vue.$bus.$emit('main-reset-size-listener', null);
  }
}
export class WindowSizeHelperForApp extends WindowSizeHelper {
  constructor(vue) {
    super(vue);
    console.log('lyc resize');
    this.win = this.vue.$electron.remote.getCurrentWindow();
    this.ratio = null;
    this.width = null;
    this.height = null;
    this.type = 'width';
    this.time = 200;
    this.start = 500;
    this.vue.$electron.ipcRenderer.on('main-resize', () => { this.onResize(); });
    this.vue.$bus.$on('main-setNewWindowSize', () => { this.onSetNewWindowSize(); });
    this.vue.$bus.$on('main-reset-size-listener', () => { this.onReset(); });
    this.block = false;
    this.ready = false;
  }
  onReset() {
    this.ratio = null;
    this.width = null;
    this.height = null;
    this.ready = false;
  }
  onSetNewWindowSize(arg) {
    if (arg) {
      this.width = arg.width;
      this.height = arg.height;
      this.ratio = this.calcRatio();
    } else {
      this.width = this.win.getBounds().width;
      this.height = this.win.getBounds().height;
      this.ratio = this.calcRatio();
    }
    this.start = this.width; // todo
    this.ready = true;
  }
  onResize() { // eslint-disable-line
    // this.update();
    // if (!this.block) {
    //   this.block = true;
    //   setTimeout(() => {
    //     this.height += (this.width - this.start) * this.ratio;
    //     this.win.setSize(Math.ceil(this.width), Math.ceil(this.height));
    //     this.block = false;
    //     this.change = 0;
    //     this.start = this.width;
    //   }, this.time);
    // }
  }
  calcRatio() {
    return this.height / this.width;
  }
  update() {
    if (this.type) {
      if (this.type === 'width') {
        this.width = this.win.getSize()[0]; //eslint-disable-line
      } else {
        this.height = this.win.getSize()[1];  //eslint-disable-line
      }
    }
  }
  onStart() {
    if (!this.ratio || !this.height) return;
    const { width, height } = this.win.getBounds();
    if (!this.type) return;
    if (this.type === 'width') {
      this.height = Math.ceil(width * this.ratio);
    } else {
      this.width = Math.ceil(height / this.ratio);
    }
    this.win.setSize(this.width, this.height);
  }
  changeType(widthNow, heightNow) {
    // if changed together
    // console.log(`lyc${this.width}..${this.height}`);
    // console.log(`lyc${widthNow}..${heightNow}`);
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
}
