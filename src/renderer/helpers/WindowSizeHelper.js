export default class WindowSizeHelper {
  constructor(vue) {
    this.vue = vue;
    console.log('lyc here');
  }
  setNewWindowSize(arg) {
    this.vue.$electron.ipcRenderer.send('main-setNewWindowSize', arg);
  }
  resetListener() {
    this.vue.$electron.ipcRenderer.send('main-reset-size-listener', null);
  }
}
