
import Vuex from 'vuex';
import sinon from 'sinon';
import EventEmitter from 'events';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import AppState from '@/store/modules/AppState';
import WindowState from '@/store/modules/WindowState';
import PlaybackState from '@/store/modules/PlaybackState';
import PlayingView from '@/components/PlayingView';

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
      if (this.paused) {
        this.play();
      } else {
        this.pause();
      }
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
  vue.$refs.VideoCanvasRef.$refs.videoCanvas = vcanvas;
  return vcanvas;
}
const localVue = createLocalVue();

localVue.use(Vuex);

describe('PlayingView.vue', () => {
  let store;

  beforeEach(() => {
    // state = PlaybackState.state;
    store = new Vuex.Store({
      modules: {
        AppState,
        WindowState,
        PlaybackState,
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
    expect(globalEventBusEmitSpy.callCount).equal(7);
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
describe('PlayingView.vue.lyc', () => {
  let store;
  let timer; //eslint-disable-line
  beforeEach(() => {
    timer = sinon.useFakeTimers();
    // state = PlaybackState.state;
    store = new Vuex.Store({
      modules: {
        AppState,
        WindowState,
        PlaybackState,
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
  it('should play on focus click when video is playing', () => {
    store.commit('isPlaying', true);
    store.commit('isFocused', false);
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    const vue = wrapper.vm;
    electronMock(vue, windowMock(vue));
    videoCanvasMock(vue, busMock(vue));
    const globalEventBusEmitSpy = sinon.spy(vue.$bus, '$emit');
    store.commit('isFocused', true);
    vue.handleLeftClick();
    vue.handleMouseUp();
    timer.tick(200);
    expect(new Date() - vue.focusTimestamp).lessThan(vue.firstMouseTimeSpan);
    expect(globalEventBusEmitSpy.calledWith('play')).equal(false);
    expect(globalEventBusEmitSpy.calledWith('toggle-playback')).equal(false);
  });
  it('should play on focus click when video is not playing', () => {
    store.commit('isPlaying', false);
    store.commit('isFocused', false);
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    const vue = wrapper.vm;
    electronMock(vue, windowMock(vue));
    videoCanvasMock(vue, busMock(vue));
    const globalEventBusEmitSpy = sinon.spy(vue.$bus, '$emit');
    store.commit('isFocused', true);
    vue.handleLeftClick();
    timer.tick(100);
    vue.handleMouseUp();
    timer.tick(200);
    expect(new Date() - vue.focusTimestamp).lessThan(vue.firstMouseTimeSpan);
    expect(globalEventBusEmitSpy.calledWith('play')).equal(true);
    expect(globalEventBusEmitSpy.calledWith('toggle-playback')).equal(false);
  });
  it('shoud pause on non-focus click when video is playing', () => {
    store.commit('isPlaying', true);
    store.commit('isFocused', false);
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    const vue = wrapper.vm;
    electronMock(vue, windowMock(vue));
    videoCanvasMock(vue, busMock(vue));
    const globalEventBusEmitSpy = sinon.spy(vue.$bus, '$emit');
    store.commit('isFocused', true);
    timer.tick(vue.firstMouseTimeSpan);
    vue.handleLeftClick();
    timer.tick(100);
    vue.handleMouseUp();
    timer.tick(200);
    expect(globalEventBusEmitSpy.calledWith('play')).equal(false);
    expect(globalEventBusEmitSpy.calledWith('toggle-playback')).equal(true);
  });
  it('test for when click center validly', () => {
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    const vue = wrapper.vm;
    electronMock(vue, windowMock(vue));
    const win = vue.mainWindow;
    videoCanvasMock(vue, busMock(vue));
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

