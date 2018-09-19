import Vuex from 'vuex';
import PlaybackState from '@/store/modules/PlaybackState';
import WindowState from '@/store/modules/WindowState';
import TimeProgressBar from '@/components/PlayingView/TimeProgressBar';
import { mount, createLocalVue } from '@vue/test-utils';
import sinon from 'sinon';

const localVue = createLocalVue();
localVue.use(Vuex);

function cssSplit(str) {
  const O = {};
  const S = str.match(/([^ :;]+)/g) || [];
  while (S.length) {
    O[S.shift()] = S.shift() || '';
  }
  return O;
}

describe('TimeProgressBar.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        PlaybackState: {
          state: PlaybackState.state,
          mutations: PlaybackState.mutations,
        },
        WindowState: {
          state: WindowState.state,
          getters: WindowState.getters,
        },
      },
    });
  });

  it('should load correct data', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    expect(wrapper.vm.showScreenshot).equal(false);
    expect(wrapper.vm.onProgressSliderMousedown).equal(false);
    expect(wrapper.vm.flagProgressBarDraged).equal(false);
    expect(wrapper.vm.isCursorLeft).equal(false);
    expect(wrapper.vm.isOnProgress).equal(false);
    expect(wrapper.vm.isShaking).equal(false);
    expect(wrapper.vm.isRestartClicked).equal(false);
    expect(wrapper.vm.timeoutIdOfProgressBarDisappearDelay).equal(0);
    expect(wrapper.vm.timeoutIdOfBackBarDisapppearDelay).equal(0);
    expect(wrapper.vm.percentageOfReadyToPlay).equal(0);
    expect(wrapper.vm.cursorPosition).equal(0);
    expect(wrapper.vm.videoRatio).equal(1.78);
    expect(wrapper.vm.percentageVideoDraged).equal(0);
    expect(wrapper.vm.widthOfThumbnail).equal(136);
    expect(wrapper.vm.thumbnailCurrentTime).equal(0);
    expect(wrapper.vm.buttonWidth).equal(20);
    expect(wrapper.vm.buttonRadius).equal(0);
    expect(wrapper.vm.cursorStyle).equal('pointer');
  });

  it('appearProgressSlider method works fine', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    wrapper.setData({ isOnProgress: false });
    wrapper.vm.appearProgressSlider();
    expect(wrapper.vm.isOnProgress).equal(true);
    wrapper.vm.appearProgressSlider();
    const playedSlider = wrapper.find({ ref: 'playedSlider' });
    const foolProofBar = wrapper.find({ ref: 'foolProofBar' });
    const readySlider = wrapper.find({ ref: 'readySlider' });
    const backSlider = wrapper.find({ ref: 'backSlider' });
    expect(cssSplit(playedSlider.attributes().style).height).equal('10px');
    expect(cssSplit(foolProofBar.attributes().style).height).equal('10px');
    expect(cssSplit(readySlider.attributes().style).height).equal('10px');
    expect(cssSplit(backSlider.attributes().style).height).equal('10px');
  });

  it('hideProgressSlider method works fine - 1', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    wrapper.setData({
      onProgressSliderMousedown: true,
      isOnProgress: true,
    });
    wrapper.vm.hideProgressSlider();
    expect(wrapper.vm.isOnProgress).equal(true);
  });

  it('hideProgressBar method works fine - 2', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    wrapper.setData({
      onProgressSliderMousedown: false,
      isOnProgress: true,
      showScreenshot: true,
    });
    wrapper.vm.hideProgressSlider();
    expect(wrapper.vm.isOnProgress).equal(false);
    expect(wrapper.vm.showScreenshot).equal(false);
    expect(wrapper.vm.buttonRadius).equal(0);
    const playedSlider = wrapper.find({ ref: 'playedSlider' });
    const foolProofBar = wrapper.find({ ref: 'foolProofBar' });
    const readySlider = wrapper.find({ ref: 'readySlider' });
    const backSlider = wrapper.find({ ref: 'backSlider' });
    expect(cssSplit(playedSlider.attributes().style).height).equal('4px');
    expect(cssSplit(foolProofBar.attributes().style).height).equal('4px');
    expect(cssSplit(readySlider.attributes().style).height).equal('0px');
    expect(cssSplit(backSlider.attributes().style).height).equal('4px');
  });

  it('videoRestart method works fine', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    wrapper.setData({
      buttonRadius: 20,
      showScreenshot: true,
      isRestartClicked: false,
      cursorStyle: 'pointer',
    });
    const stub = sinon.stub(wrapper.vm.$bus, '$emit');
    wrapper.vm.videoRestart();
    expect(stub.calledOnce).equal(true);
    expect(stub.firstCall.args[0]).equal('seek');
    expect(stub.firstCall.args[1]).equal(0);
    stub.restore();
    expect(wrapper.vm.buttonRadius).equal(0);
    expect(wrapper.vm.showScreenshot).equal(false);
    expect(wrapper.vm.isRestartClicked).equal(true);
    expect(wrapper.vm.cursorStyle).equal('default');
  });

  it('onProgressBarMove method works fine - 1', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    store.state.PlaybackState.Duration = NaN;
    wrapper.setData({ onProgressSliderMousedown: false });
    const spy = sinon.spy(wrapper.vm, '$_effectProgressBarDraged');
    wrapper.vm.onProgressBarMove();
    expect(Number.isNaN(store.state.PlaybackState.Duration)).equal(true);
    expect(spy.calledOnce).equal(false);
    spy.restore();
  });

  it('handleFakeBtnMove method works fine - 2', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    wrapper.setData({
      isRestartClicked: true,
    });
    const spy = sinon.spy(wrapper.vm, 'hideProgressSlider');
    wrapper.vm.handleFakeBtnMove();
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });

  it('$_hideAllWidgets method works fine', () => {

  });

  // the methods after onProgressBarMove() manipulate computed methods a lot,
  // so the following test cases will test all the computed properties first.
  // then will go for the rest of methods testing.

  it('winWidth computed property works fine', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    store.state.WindowState.windowSize = [0, 0];
    expect(wrapper.vm.winWidth).equal(0);
    store.state.WindowState.windowSize = [1, 0];
    expect(wrapper.vm.winWidth).equal(1);
    store.state.WindowState.windowSize = [999, 0];
    expect(wrapper.vm.winWidth).equal(999);
    store.state.WindowState.windowSize = [NaN, 0];
    expect(Number.isNaN(wrapper.vm.winWidth)).equal(true);
    store.state.WindowState.windowSize = [Infinity, 0];
    expect(wrapper.vm.winWidth).equal(Infinity);
  });

  it('curProgressBarEdge computed property works fine - 1', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    store.state.PlaybackState.Duration = NaN;
    expect(wrapper.vm.curProgressBarEdge).equal(0);
  });

  it('curProgressBarEdge computed property works fine - 2', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });

    store.state.WindowState.windowSize = [600, 600];
    store.state.PlaybackState.AccurateTime = 100;
    store.state.PlaybackState.Duration = 500;
    // (100/500)*580 = 116
    expect(wrapper.vm.curProgressBarEdge).equal(116);

    store.state.WindowState.windowSize = [1000, 600];
    store.state.PlaybackState.AccurateTime = 1000;
    store.state.PlaybackState.Duration = 500;
    expect(wrapper.vm.curProgressBarEdge).equal(1960);

    store.state.WindowState.windowSize = [1000, 600];
    store.state.PlaybackState.AccurateTime = 500;
    store.state.PlaybackState.Duration = 500;
    expect(wrapper.vm.curProgressBarEdge).equal(980);
  });

  it('cursorState computed property works fine - 1', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    wrapper.setData({ isOnProgress: true });
    expect(wrapper.vm.cursorState).equal(wrapper.vm.cursorPosition);
  });

  it('cursorState computed property works fine - 2', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    wrapper.setData({ isOnProgress: false });
    expect(wrapper.vm.cursorState).equal(wrapper.vm.curProgressBarEdge);
  });

  it('readyBarWidth computed property works fine', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    wrapper.setData({ isCursorLeft: true });
    expect(wrapper.vm.readyBarWidth).equal(0);
    wrapper.setData({ isCursorLeft: false });
    expect(wrapper.vm.readyBarWidth).equal(Math.abs(wrapper.vm.curProgressBarEdge
      - wrapper.vm.cursorState));
  });

  it('backBarWidth computed property works fine', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    wrapper.setData({ cursorPosition: 0 });
    expect(wrapper.vm.backBarWidth).equal(0);
    wrapper.setData({
      cursorPosition: 100,
      isCursorLeft: true,
    });
    expect(wrapper.vm.backBarWidth).equal(100);
    wrapper.setData({
      cursorPosition: 200,
      isCursorLeft: false,
    });
    expect(wrapper.vm.backBarWidth).equal(0);
  });

  it('progressOpacity computed property works fine', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    wrapper.setData({
      isRestartClicked: true,
    });
    expect(wrapper.vm.progressOpacity).equal(0.9);
    wrapper.setData({
      isRestartClicked: false,
      isOnProgress: false,
    });
    expect(wrapper.vm.progressOpacity).equal(0.9);
    wrapper.setData({
      isRestartClicked: false,
      isOnProgress: true,
      isCursorLeft: true,
    });
    expect(wrapper.vm.progressOpacity).equal(0.3);
    wrapper.setData({
      isRestartClicked: false,
      isOnProgress: true,
      isCursorLeft: false,
    });
    expect(wrapper.vm.progressOpacity).equal(0.9);
  });

  it('heightOfThumbnail computed property works fine', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    wrapper.setData({
      widthOfThumbnail: 200,
      videoRatio: 2,
    });
    expect(wrapper.vm.heightOfThumbnail).equal(100);
    wrapper.setData({
      widthOfThumbnail: 0,
      videoRatio: 500,
    });
    expect(wrapper.vm.heightOfThumbnail).equal(0);
    wrapper.setData({
      widthOfThumbnail: 1,
      videoRatio: 1,
    });
    expect(wrapper.vm.heightOfThumbnail).equal(1);
  });

  it('positionOfScreenshot computed property works fine', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    store.state.WindowState.windowSize = [600, 600]; // const1 = 580
    // const2  = 50, const3 = 66, const4 = 564
    wrapper.setData({ widthOfThumbnail: 100 });
    wrapper.setData({ cursorPosition: 49 });
    expect(wrapper.vm.positionOfScreenshot).equal(-4);
    wrapper.setData({ cursorPosition: 520 });
    expect(wrapper.vm.positionOfScreenshot).equal(464);
    wrapper.setData({ cursorPosition: 100 });
    expect(wrapper.vm.positionOfScreenshot).equal(50);
    wrapper.setData({ cursorPosition: 500 });
    expect(wrapper.vm.positionOfScreenshot).equal(450);
  });

  it('screenshotContent computed property works fine', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    store.state.PlaybackState.Duration = 1000;
    wrapper.setData({ percentageOfReadyToPlay: 0.2 });
    expect(wrapper.vm.screenshotContent).equal('03:20');
    store.state.PlaybackState.Duration = 1000;
    wrapper.setData({ percentageOfReadyToPlay: 0.65 });
    expect(wrapper.vm.screenshotContent).equal('10:50');
  });

  // rest of the methods testing
  // $_documentProgressDragEvent method and
  // $_documentProgressDragClear method requires document.MouseEvent
  // as a parameter inside these methods, but both methods themselves
  // have no input parameter required.
  // so the testing for the 2 methods - 待

  // followingh test cases are for testing the watch property
  it('cursorPosition watched property works as expected - 1', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    wrapper.setData({
      isShaking: false,
      isOnProgress: true,
      cursorPosition: -2,
    });
    wrapper.setData({ cursorPosition: -5 });
    expect(wrapper.vm.buttonRadius).equal(20);
    expect(wrapper.vm.isShaking).equal(true);
  });

  it('cursorPosition watched property works as expected - 2', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    wrapper.setData({
      isShaking: false,
      isOnProgress: false,
      cursorPosition: 10,
    });
    wrapper.setData({ cursorPosition: 20 });
    expect(wrapper.vm.isShaking).equal(false);
    expect(wrapper.vm.isOnProgress).equal(false);
  });

  it('isOnProgress watched property works as expected - 1', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      propsData: {
        src: ' ',
      },
    });
    const clock = sinon.useFakeTimers();
    sinon.spy(clock, 'clearTimeout');
    wrapper.setData({
      timeoutIdOfBackBarDisapppearDelay: 200,
    });
    wrapper.setData({ isOnProgress: true });
    sinon.assert.calledOnce(clock.clearTimeout);
    sinon.assert.calledWith(clock.clearTimeout, 200);
    clock.restore();
  });

  // testing for created hook


  /* 此electron.ipcRenderer发送事件的测试失败了，因为titlebar文件也在
    监听main-resize事件，此vm发送了这个事件，titlebar也在监听，
    所以触发了两个on之后的箭头函数，所以测试这个事件的方法待研究。
  it('the created hook works as expected, event $on - 1.1', () => {
    const wrapper = shallowMount(TimeProgressBar, { store, localVue });
    store.state.WindowState.windowSize = [600, 600];
    wrapper.vm.$electron.ipcRenderer.emit('main-resize');
    const stub = sinon.stub(wrapper.vm.$electron.ipcRenderer, 'on');
    stub.yields();
    expect(wrapper.vm.widthOfThumbnail).equal(136);
    stub.restore();
  }); */
});
