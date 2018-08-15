export class UnfocusedHelper {
  constructor() {
    this.True = true;
  }
  needHandle() {
    return this.True;
  }
}

export class UnfocusedHelperForMac extends UnfocusedHelper {
  constructor(win, vue) {
    super();
    this.win = win;
    this.vue = vue;
    this.bus = this.vue.$bus;
    this.videoCanvas = this.vue.$refs.VideoCanvasRef.$refs.videoCanvas;
    this.win.on('focus', () => { this.onFocus(); });
  }
  needHandle() {
    if (!this.win.isFocused()) {
      return false;
    }
    return true;
  }
  onFocus() {
    if (this.videoCanvas.paused) {
      if (this.cursorInWindow()) {
        this.bus.$emit('play');
      }
    } else {
      this.vue.wakeUpAllWidgets();
      // this.bus.$emit('pause');
    }
  }
  cursorInWindow() {
    const cp = this.vue.$electron.screen.getCursorScreenPoint();
    const wb = this.win.getBounds();
    if (wb.x < cp.x && cp.x < (wb.x + wb.width) && wb.y < cp.y && cp.y < (wb.y + wb.height)) {
      return true;
    }
    return false;
  }
}

export default function getHelper() {
  if (process.platform === 'darwin') {
    return UnfocusedHelperForMac;
  }
  return UnfocusedHelper;
}
