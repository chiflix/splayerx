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
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    expect(wrapper.vm.showScreenshot).equal(false);
    expect(wrapper.vm.showProgressBar).equal(true);
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
    expect(wrapper.vm.videoRatio).equal(0);
    expect(wrapper.vm.percentageVideoDraged).equal(0);
    expect(wrapper.vm.widthOfThumbnail).equal(0);
    expect(wrapper.vm.thumbnailCurrentTime).equal(0);
    expect(wrapper.vm.buttonWidth).equal(20);
    expect(wrapper.vm.buttonRadius).equal(0);
    expect(wrapper.vm.cursorStyle).equal('pointer');
  });

  it('progress mouseover trigger', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    const spy = sinon.spy(wrapper.vm, 'appearProgressSlider');
    wrapper.find('.progress').trigger('mouseover.stop.capture');
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });

  it('progress mouseleave trigger', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    const spy = sinon.spy(wrapper.vm, 'hideProgressSlider');
    wrapper.find('.progress').trigger('mouseover.stop.capture');
    wrapper.find('.progress').trigger('mouseleave');
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });

  it('progress mousemove trigger', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    const spy = sinon.spy(wrapper.vm, 'onProgressBarMove');
    wrapper.find('.progress').trigger('mouseover.stop.capture');
    wrapper.find('.progress').trigger('mousemove');
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });

  it('fool-proof-bar mousedown trigger', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    const spy = sinon.spy(wrapper.vm, 'videoRestart');
    wrapper.find('.progress').trigger('mouseover.stop.capture');
    wrapper.find('.fool-proof-bar').trigger('mousedown.stop');
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });

  it('fake-button mousedonwn trigger', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    const spy = sinon.spy(wrapper.vm, 'handleFakeBtnClick');
    wrapper.find('.progress').trigger('mouseover.stop.capture');
    wrapper.find('.fake-button').trigger('mousedown');
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });

  it('fake-button mousemove trigger', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    const spy = sinon.spy(wrapper.vm, 'handleFakeBtnMove');
    wrapper.find('.progress').trigger('mouseover.stop.capture');
    wrapper.find('.fake-button').trigger('mousemove.stop');
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });

  it('progress-container mousedown trigger', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setData({
      winWidth: 1000,
    });
    const spy = sinon.spy(wrapper.vm, 'onProgressBarClick');
    wrapper.find('.progress').trigger('mouseover.stop.capture');
    wrapper.find('.progress-container').trigger('mousedown.stop.capture');
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });

  it('appearProgressSlider method works fine', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    wrapper.setData({ isOnProgress: false });
    const spy = sinon.spy(wrapper.vm.$bus, '$emit');
    wrapper.vm.appearProgressSlider();
    expect(wrapper.vm.isOnProgress).equal(true);
    expect(spy.calledOnce).equal(true);
    expect(spy.firstCall.args[0]).equal('clear-all-widget-disappear-delay');
    spy.restore();
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
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    wrapper.setData({
      onProgressSliderMousedown: true,
      isOnProgress: true,
    });
    wrapper.vm.hideProgressSlider();
    expect(wrapper.vm.isOnProgress).equal(true);
  });

  it('hideProgressBar method works fine - 2', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
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

  it('appearProgressBar method works fine', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    wrapper.setData({ showProgressBar: false });
    const spy = sinon.spy(wrapper.vm, '$_clearTimeoutDelay');
    wrapper.vm.appearProgressBar();
    expect(spy.calledOnce).equal(true);
    expect(wrapper.vm.showProgressBar).equal(true);
    spy.restore();
  });

  it('hideProgressBar method works fine - 1', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    wrapper.setData({
      onProgressSliderMousedown: true,
      showProgressBar: true,
    });
    const spy = sinon.spy(wrapper.vm, 'hideProgressSlider');
    wrapper.vm.hideProgressBar();
    expect(wrapper.vm.showProgressBar).not.equal(false);
    expect(spy.calledOnce).equal(false);
    spy.restore();
  });

  it('hideProgressBar method works fine - 2', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    wrapper.setData({
      onProgressSliderMousedown: false,
      showProgressBar: true,
    });
    const spy = sinon.spy(wrapper.vm, 'hideProgressSlider');
    wrapper.vm.hideProgressBar();
    expect(wrapper.vm.showProgressBar).equal(false);
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });

  it('videoRestart method works fine', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setData({
      buttonRadius: 20,
      showScreenshot: true,
      isRestartClicked: false,
      cursorStyle: 'pointer',
    });
    const spy = sinon.spy(wrapper.vm.$bus, '$emit');
    wrapper.vm.videoRestart();
    expect(wrapper.vm.buttonRadius).equal(0);
    expect(wrapper.vm.showScreenshot).equal(false);
    expect(wrapper.vm.isRestartClicked).equal(true);
    expect(wrapper.vm.cursorStyle).equal('default');
    expect(spy.calledOnce).equal(true);
    expect(spy.firstCall.args[0]).equal('seek');
    expect(spy.firstCall.args[1]).equal(0);
    spy.restore();
  });

  it('onProgressBarClick method can be triggered correctly', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    const spy = sinon.spy(wrapper.vm, 'onProgressBarClick');
    wrapper.find('.progress-container').trigger('mousedown.left');
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });

  it('onProgressBarClick method works fine - 1', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    const target = wrapper.find('.progress-container');
    const testEvent = new MouseEvent(target.trigger('mousedown.left'), {
      clientX: 2000,
      clientY: 2000,
    });
    wrapper.setData({ onProgressSliderMousedown: false });
    store.state.PlaybackState.Duration = NaN;
    wrapper.vm.onProgressBarClick(testEvent);
    expect(wrapper.vm.onProgressBarClick(testEvent)).equal(undefined);
    expect(wrapper.vm.onProgressSliderMousedown).equal(false);
  });

  it('onProgressBarClick method works fine - 2', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    const target = wrapper.find('.progress-container');
    const testEvent = new MouseEvent(target.trigger('mousedown.left'), {
      clientX: 2000,
      clientY: 2000,
    });
    wrapper.setData({ onProgressSliderMousedown: false });
    store.state.PlaybackState.Duration = 600;
    const spy1 = sinon.spy(wrapper.vm.$bus, '$emit');
    const spy2 = sinon.spy(wrapper.vm, '$_documentProgressDragClear');
    const spy3 = sinon.spy(wrapper.vm, '$_documentProgressDragEvent');
    wrapper.vm.onProgressBarClick(testEvent);
    expect(wrapper.vm.onProgressSliderMousedown).equal(true);
    expect(spy1.calledOnce).equal(true);
    expect(spy1.firstCall.args[0]).equal('seek');
    expect(spy2.calledOnce).equal(true);
    expect(spy3.calledOnce).equal(true);
    spy1.restore();
    spy2.restore();
    spy3.restore();
  });

  it('onProgressBarMove method works fine - 1', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    store.state.PlaybackState.Duration = NaN;
    wrapper.setData({ onProgressSliderMousedown: false });
    const spy = sinon.spy(wrapper.vm, '$_effectProgressBarDraged');
    wrapper.vm.onProgressBarMove();
    expect(Number.isNaN(store.state.PlaybackState.Duration)).equal(true);
    expect(spy.calledOnce).equal(false);
    spy.restore();
  });

  // 此处测试如何处理
  it('onProgressBarMove method works fine - 2', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    store.state.PlaybackState.Duration = 1000;
    wrapper.setData({
      onProgressSliderMousedown: false,
      isRestartClicked: true,
      cursorStyle: 'default',
    });
    const target = wrapper.find('.progress');
    const testEvent = new MouseEvent(target.trigger('mousedown.left'), {
      clientX: 2000,
      clientY: 2000,
    });
    const spy = sinon.spy(wrapper.vm, '$_effectProgressBarDraged');
    wrapper.vm.onProgressBarMove(testEvent);
    expect(wrapper.vm.isRestartClicked).equal(false);
    expect(wrapper.vm.cursorStyle).equal('pointer');
    expect(spy.calledOnce).equal(true);
    expect(spy.firstCall.args[0]).equal(testEvent);
    spy.restore();
  });

  it('$_effectProgressBarDraged method works fine - 1', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      attachToDocument: true,
    });
    wrapper.setProps({ src: '' });
    const target = wrapper.find('.progress');
    const testEvent = new MouseEvent(target.trigger('mousedown.left'), {
      clientX: 2000,
      clientY: 2000,
    });
    store.state.WindowState.windowSize = [1000, 0];
    store.state.PlaybackState.AccurateTime = 200;
    store.state.PlaybackState.Duration = 500;
    wrapper.vm.$_effectProgressBarDraged(testEvent);
    expect(wrapper.vm.cursorPosition).equal(1980);
    expect(wrapper.vm.isCursorLeft).equal(false);
    expect(wrapper.vm.percentageOfReadyToPlay).equal(1);
    expect(wrapper.vm.showScreenshot).equal(true);
  });

  it('$_effectProgressBarDraged method works fine - 2', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      attachToDocument: true,
    });
    wrapper.setProps({ src: '' });
    const target = wrapper.find('.progress');
    const testEvent = new MouseEvent(target.trigger('mousedown.left'), {
      clientX: 118,
      clientY: 118,
    });
    store.state.WindowState.windowSize = [1000, 0];
    store.state.PlaybackState.AccurateTime = 200;
    store.state.PlaybackState.Duration = 500;
    wrapper.vm.$_effectProgressBarDraged(testEvent);
    expect(wrapper.vm.cursorPosition).equal(98);
    expect(wrapper.vm.isCursorLeft).equal(true);
    expect(wrapper.vm.percentageOfReadyToPlay).equal(0.1);
    expect(wrapper.vm.thumbnailCurrentTime).equal(50);
    expect(wrapper.vm.showScreenshot).equal(true);
  });

  it('$_effectProgressBarDraged method works fine - 2', () => {
    const wrapper = mount(TimeProgressBar, {
      store,
      localVue,
      attachToDocument: true,
    });
    wrapper.setProps({ src: '' });
    const target = wrapper.find('.progress');
    const testEvent = new MouseEvent(target.trigger('mousedown.left'), {
      clientX: 18,
      clientY: 18,
    });
    store.state.WindowState.windowSize = [1000, 0];
    store.state.PlaybackState.AccurateTime = 200;
    store.state.PlaybackState.Duration = 500;
    wrapper.vm.$_effectProgressBarDraged(testEvent);
    expect(wrapper.vm.cursorPosition).equal(-2);
    expect(wrapper.vm.isCursorLeft).equal(true);
    expect(wrapper.vm.percentageOfReadyToPlay).equal(0);
    expect(wrapper.vm.showScreenshot).equal(true);
  });

  it('handleFakeBtnClick method works fine', () => {

  });

  it('handleFakeBtnMove method works fine - 1', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setData({
      isRestartClicked: false,
    });
    const target = wrapper.find('.fake-button');
    const testEvent = new MouseEvent(target.trigger('mousemove.stop'), {
      clientX: 18,
      clientY: 18,
    });
    const spy = sinon.spy(wrapper.vm, 'onProgressBarMove');
    wrapper.vm.handleFakeBtnMove(testEvent);
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });

  it('handleFakeBtnMove method works fine - 2', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
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
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
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
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    store.state.PlaybackState.Duration = NaN;
    expect(wrapper.vm.curProgressBarEdge).equal(0);
  });

  it('curProgressBarEdge computed property works fine - 2', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });

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
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    wrapper.setData({ isOnProgress: true });
    expect(wrapper.vm.cursorState).equal(wrapper.vm.cursorPosition);
  });

  it('cursorState computed property works fine - 2', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    wrapper.setData({ isOnProgress: false });
    expect(wrapper.vm.cursorState).equal(wrapper.vm.curProgressBarEdge);
  });

  it('readyBarWidth computed property works fine', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    wrapper.setData({ isCursorLeft: true });
    expect(wrapper.vm.readyBarWidth).equal(0);
    wrapper.setData({ isCursorLeft: false });
    expect(wrapper.vm.readyBarWidth).equal(Math.abs(wrapper.vm.curProgressBarEdge
      - wrapper.vm.cursorState));
  });

  it('backBarWidth computed property works fine', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
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
    const wrapper = mount(TimeProgressBar, { store, localVue });
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
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
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
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
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
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
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
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
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
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
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
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
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

  it('created hook works as expected, event $on - 2', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    wrapper.setData({
      showScreenshot: true,
      isOnProgress: true,
    });
    const spy2 = sinon.spy();
    wrapper.vm.$bus.$emit('progressslider-appear');
    const stub = sinon.stub(wrapper.vm.$bus, '$on');
    stub.yields();
    stub('progressslider-appear', spy2);
    expect(spy2.calledOnce).equal(true);
    expect(wrapper.vm.showScreenshot).equal(false);
    expect(wrapper.vm.isOnProgress).equal(false);
    stub.restore();
  });

  it('created hood works as expected, event $on - 3', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    const spy = sinon.spy(wrapper.vm, 'appearProgressBar');
    wrapper.vm.$bus.$emit('progressbar-appear');
    const stub = sinon.stub(wrapper.vm.$bus, '$on');
    stub.yields();
    stub('progressbar-appear', spy);
    expect(spy.calledOnce).equal(true);
    spy.restore();
    stub.restore();
  });

  it('created hood works as expected, event $on - 3', () => {
    const wrapper = mount(TimeProgressBar, { store, localVue });
    wrapper.setProps({ src: '' });
    const spy = sinon.spy(wrapper.vm, 'hideProgressBar');
    wrapper.vm.$bus.$emit('progressbar-hide');
    const stub = sinon.stub(wrapper.vm.$bus, '$on');
    stub.yields();
    stub('progressbar-hide', spy);
    expect(spy.calledOnce).equal(true);
    spy.restore();
    stub.restore();
  });
});
