import EventEmitter from 'events';
import sinon from 'sinon';
import WindowResizeHelperM from '../../../../src/main/helpers/windowResizer.js';
import WindowResizeHelperR from '../../../../src/renderer/helpers/WindowSizeHelper';
import ipcs from '../updater/ipcMock.js';
class VueSimulator {
  constructor(ipcRenderer) {
    this.$electron = {};
    this.$electron.ipcRenderer = ipcRenderer;
  }
}
class Screen {
  constructor(win) {
    this.win = win;
  }
  getCursorScreenPoint() {
    return this.win.cursor;
  }
}
class Window {
  constructor() {
    this.bounds = {
      x: 0, y: 0, width: 100, height: 100,
    };
    this.screen = new Screen(this);
    this.evnt = new EventEmitter();
    this.cursor = { x: 0, y: 0 };
  }
  getSize() {
    return [this.bounds.width, this.bounds.height];
  }
  getBounds() {
    return this.bounds;
  }
  setSize(width, height) {
    if (this.bounds.width === width && this.bounds.height === height) return;
    this.bounds.width = width;
    this.bounds.height = height;
    this.evnt.emit('resize', null);
  }
  on(msg, callback) {
    return this.evnt.on(msg, callback);
  }
}
let renderer; //eslint-disable-line
let mainProcess;
let timer; //eslint-disable-line
describe('UpdaterNotification.vue', () => {
  beforeEach(() => {
    timer = sinon.useFakeTimers();
    const ipcMr = ipcs();
    const startVue = new VueSimulator(ipcMr.ipcRenderer);
    const window = new Window();
    const screen = new Screen(window);
    renderer = new WindowResizeHelperR(startVue);
    renderer.resetListener();
    mainProcess = new WindowResizeHelperM(window);
    mainProcess.ipc = ipcMr.ipcMain;
    mainProcess.registerMessage();
    mainProcess.electron = { screen };
    renderer.setNewWindowSize({ width: 100, height: 100 });
  });
  afterEach(() => {
    timer.restore();
    sinon.restore();
  });
  it('test correct loaded', () => {
    expect(mainProcess.height).equal(100);
    expect(mainProcess.ratio).equal(1);
  });
  it('test for increase width for once', (done) => {
    mainProcess.win.cursor = { x: 110, y: 50 };
    mainProcess.win.setSize(110, 100);
    expect(mainProcess.type).equal('width');
    expect(mainProcess.status).equal('resize_WH');
    timer.tick(300);
    expect(mainProcess.status).equal('idle');
    done();
  });
  it('test for increase height for once', (done) => {
    mainProcess.win.cursor = { x: 50, y: 110 };
    mainProcess.win.setSize(100, 110);
    expect(mainProcess.type).equal('height');
    expect(mainProcess.status).equal('resize_WH');
    timer.tick(300);
    expect(mainProcess.status).equal('idle');
    done();
  });
  it('test for increase corner for once', (done) => {
    mainProcess.win.setSize(110, 110);
    mainProcess.win.cursor = { x: 110, y: 110 };
    expect(mainProcess.type).equal('corner');
    expect(mainProcess.status).equal('corner');
    done();
  });
  it('test for increase width for more than once', (done) => {
    mainProcess.win.cursor = { x: 110, y: 50 };
    mainProcess.win.setSize(110, 100);
    timer.tick(100);
    mainProcess.win.cursor = { x: 120, y: 50 };
    mainProcess.win.setSize(120, 110);
    timer.tick(200);
    expect(mainProcess.type).equal('width');
    expect(mainProcess.win.getBounds().width).equal(120);
    expect(mainProcess.win.getBounds().height).equal(120);
    expect(mainProcess.status).equal('idle');
    done();
  });
  it('test for increase height for more than once', (done) => {
    mainProcess.win.cursor = { x: 50, y: 110 };
    mainProcess.win.setSize(100, 110);
    timer.tick(100);
    mainProcess.win.cursor = { x: 110, y: 120 };
    mainProcess.win.setSize(110, 120);
    timer.tick(200);
    expect(mainProcess.type).equal('height');
    expect(mainProcess.win.getBounds().width).equal(120);
    expect(mainProcess.win.getBounds().height).equal(120);
    expect(mainProcess.status).equal('idle');
    done();
  });
  it('test for increase corner for more than once', (done) => {
    mainProcess.win.cursor = { x: 110, y: 110 };
    mainProcess.win.setSize(110, 110);
    timer.tick(100);
    mainProcess.win.cursor = { x: 120, y: 120 };
    mainProcess.win.setSize(120, 120);
    timer.tick(200);
    expect(mainProcess.type).equal('corner');
    expect(mainProcess.win.getBounds().width).equal(120);
    expect(mainProcess.win.getBounds().height).equal(120);
    expect(mainProcess.status).equal('idle');
    done();
  });
  it('test for go back', (done) => {
    mainProcess.win.cursor = { x: 110, y: 110 };
    mainProcess.win.setSize(110, 110);
    timer.tick(100);
    mainProcess.win.cursor = { x: 120, y: 120 };
    mainProcess.win.setSize(120, 120);
    timer.tick(100);
    expect(mainProcess.type).equal('corner');
    expect(mainProcess.win.getBounds().width).equal(120);
    expect(mainProcess.win.getBounds().height).equal(120);
    expect(mainProcess.status).not.equal('idle');
    done();
  });
});
