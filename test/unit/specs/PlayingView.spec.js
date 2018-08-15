
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import PlaybackState from '@/store/modules/PlaybackState';
import sinon from 'sinon';
import PlayingView from '@/components/PlayingView';
import EventEmitter from 'events';
import { UnfocusedHelperForMac } from '../../../src/renderer/components/PlayingView/helpers/macUnfocusHelper.js';
const localVue = createLocalVue();

localVue.use(Vuex);

describe('PlayingView.vue', () => {
  let store;

  beforeEach(() => {
    // state = PlaybackState.state;
    store = new Vuex.Store({
      modules: {
        PlaybackState: {
          state: PlaybackState.state,
          getters: PlaybackState.getters,
        },
      },
    });
  });
  afterEach(() => {
    sinon.restore();
  });
  it('correct data when mounted', () => {
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    expect(wrapper.vm.leave).equal(false);
    expect(wrapper.vm.isDragging).equal(false);
    expect(wrapper.vm.showMask).equal(false);
    expect(wrapper.vm.cursorShow).equal(true);
    expect(wrapper.vm.popupShow).equal(false);
    expect(wrapper.vm.mouseDown).equal(false);
    expect(wrapper.vm.timeoutIdOfAllWidgetsDisappearDelay).equal(0);
    expect(wrapper.vm.delay).equal(200);
    expect(wrapper.vm.clicks).equal(0);
  });
  // 待完善
  it('mouseleave event trigger', () => {
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    wrapper.find('.video-controller').trigger('mouseleave');
    expect(wrapper.vm.leave).equal(true);
  });
  it('hideAllWidgets method works fine', () => {
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    const globalEventBusEmitSpy = sinon.spy(wrapper.vm.$bus, '$emit');
    wrapper.vm.hideAllWidgets();

    // whether event bus works fine
    expect(globalEventBusEmitSpy.callCount).equal(6);
    expect(globalEventBusEmitSpy.calledWith('volumecontroller-hide')).equal(true);
    expect(globalEventBusEmitSpy.calledWith('progressbar-hide')).equal(true);
    expect(globalEventBusEmitSpy.calledWith('timecode-hide')).equal(true);
    expect(globalEventBusEmitSpy.calledWith('sub-ctrl-hide')).equal(true);
    expect(globalEventBusEmitSpy.calledWith('titlebar-hide')).equal(true);

    expect(wrapper.vm.cursorShow).equal(false);
    globalEventBusEmitSpy.restore();
  });

  it('Im so DOPE', () => {
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    const stub = sinon.stub(wrapper.vm.$bus, '$on');
    stub.yields();
    const spy = sinon.spy(wrapper.vm, 'hideAllWidgets');
    stub('hideAllWidgets', spy);
    expect(spy.calledOnce).equal(true);
    stub.restore();
    spy.restore();
  });
});
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
    this.focus = false;
  }
  getSize() {
    return [this.bounds.width, this.bounds.height];
  }
  isFocused() {
    return this.focus;
  }
  focusWindow() {
    if (!this.focus) {
      this.evnt.emit('focus');
    }
    this.focus = true;
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
class VideoCanvas {
  constructor(bus) {
    this.paused = false;
    this.$bus = bus;
    this.$bus.$on('toggle-playback', () => {
      this.paused = !this.paused;
    });
    this.$bus.$on('play', () => {
      this.play();
    });
    this.$bus.$on('pause', () => {
      this.pause();
    });
  }
  play() {
    this.paused = false;
  }
  pause() {
    this.paused = true;
  }
}
function windowMock(vue) {
  const win = new Window();
  vue.mainWindow = win;
  return win;
}
function electronMock(vue, win) {
  vue.$electron = {
    screen: win.screen,
    remote: { Menu: { getApplicationMenu: () => ({ closePopup: () => {} }) } },
  };
  return vue.$electron;
}
function busMock(vue) {
  const evnt = new EventEmitter();
  vue.$bus = {
    $on: (msg, callback) => { evnt.on(msg, callback); },
    $emit: (msg) => { evnt.emit(msg); },
  };
  return vue.$bus;
}
function videoCanvasMock(vue, bus) {
  const vcanvas = new VideoCanvas(bus);
  busMock(vcanvas);
  vue.$refs.VideoCanvasRef.$refs.videoCanvas = vcanvas;
  return vcanvas;
}
describe.only('PlayingView.vue.lyc', () => {
  let store;
  let timer; //eslint-disable-line
  beforeEach(() => {
    timer = sinon.useFakeTimers();
    // state = PlaybackState.state;
    store = new Vuex.Store({
      modules: {
        PlaybackState: {
          state: PlaybackState.state,
          getters: PlaybackState.getters,
        },
      },
    });
  });
  afterEach(() => {
    sinon.restore();
  });
  /*
     * test for mac for not focused
     * test for click pause and stop bug fix
     */
  it('test for mac for on focus when video is playing', () => {
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    const vue = wrapper.vm;
    electronMock(vue, windowMock(vue));
    const win = vue.mainWindow;
    videoCanvasMock(vue, busMock(vue));
    vue.unfocusedHelper = new UnfocusedHelperForMac(vue.mainWindow, vue);
    expect(vue.$refs.VideoCanvasRef.$refs.videoCanvas.paused).equal(false);
    win.focusWindow();
    expect(vue.$refs.VideoCanvasRef.$refs.videoCanvas.paused).equal(false);
  });
  it('test for mac for on focus when video is not playing', () => {
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    const vue = wrapper.vm;
    electronMock(vue, windowMock(vue));
    videoCanvasMock(vue, busMock(vue));
    vue.$refs.VideoCanvasRef.$refs.videoCanvas.pause();
    expect(vue.$refs.VideoCanvasRef.$refs.videoCanvas.paused).equal(true);
    const win = vue.mainWindow;
    vue.unfocusedHelper = new UnfocusedHelperForMac(vue.mainWindow, vue);
    win.cursor = { x: 50, y: 50 };
    win.focusWindow();
    expect(vue.$refs.VideoCanvasRef.$refs.videoCanvas.paused).equal(false);
  });
  it('test for when click center validly', () => {
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    const vue = wrapper.vm;
    electronMock(vue, windowMock(vue));
    const win = vue.mainWindow;
    videoCanvasMock(vue, busMock(vue));
    vue.unfocusedHelper = new UnfocusedHelperForMac(vue.mainWindow, vue);
    expect(vue.$refs.VideoCanvasRef.$refs.videoCanvas.paused).equal(false);
    win.cursor = { x: 50, y: 50 };
    win.focusWindow();
    expect(vue.$refs.VideoCanvasRef.$refs.videoCanvas.paused).equal(false);
    vue.handleLeftClick();
    timer.tick(100);
    vue.handleMouseUp();
    timer.tick(200);
    expect(vue.$refs.VideoCanvasRef.$refs.videoCanvas.paused).equal(true);
  });
  it('test for when click center not validly by time', () => {
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    const vue = wrapper.vm;
    electronMock(vue, windowMock(vue));
    const win = vue.mainWindow;
    videoCanvasMock(vue, busMock(vue));
    vue.unfocusedHelper = new UnfocusedHelperForMac(vue.mainWindow, vue);
    expect(vue.$refs.VideoCanvasRef.$refs.videoCanvas.paused).equal(false);
    win.cursor = { x: 50, y: 50 };
    win.focusWindow();
    expect(vue.$refs.VideoCanvasRef.$refs.videoCanvas.paused).equal(false);
    vue.handleLeftClick();
    timer.tick(300);
    vue.handleMouseUp();
    timer.tick(200);
    expect(vue.$refs.VideoCanvasRef.$refs.videoCanvas.paused).equal(false);
  });
  it('test for when click center not validly by space', () => {
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    const vue = wrapper.vm;
    electronMock(vue, windowMock(vue));
    const win = vue.mainWindow;
    videoCanvasMock(vue, busMock(vue));
    vue.unfocusedHelper = new UnfocusedHelperForMac(vue.mainWindow, vue);
    expect(vue.$refs.VideoCanvasRef.$refs.videoCanvas.paused).equal(false);
    win.cursor = { x: 50, y: 50 };
    win.focusWindow();
    expect(vue.$refs.VideoCanvasRef.$refs.videoCanvas.paused).equal(false);
    vue.handleLeftClick();
    timer.tick(100);
    win.cursor = { x: 45, y: 51 };
    vue.handleMouseUp();
    timer.tick(200);
    expect(vue.$refs.VideoCanvasRef.$refs.videoCanvas.paused).equal(false);
  });
});

