import { createLocalVue, mount } from '@vue/test-utils';
import VideoCanvas from '@/components/PlayingView/VideoCanvas';
import Vuex from 'vuex';
import sinon from 'sinon';
import PlaybackState from '@/store/modules/PlaybackState';

const localVue = createLocalVue();
localVue.use(Vuex);


describe('VideoCanvas.vue', () => {
  let store;
  let wrapper;
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        PlaybackState: {
          state: PlaybackState.state,
          mutations: PlaybackState.mutations,
        },
        WindowState: {},
      },
    });
    wrapper = mount(VideoCanvas, {
      store,
      localVue,
      propsData: {
        src: 'file:///./../../../../test/assets/test.avi',
      },
    });
  });

  afterEach(() => {
    wrapper.destroy();
  });

  it('should load correct data', () => {
    expect(wrapper.vm.videoExisted).equal(false);
    expect(wrapper.vm.shownTextTrack).equal(false);
    expect(wrapper.vm.newWidthOfWindow).equal(0);
    expect(wrapper.vm.newHeightOfWindow).equal(0);
    expect(wrapper.vm.videoWidth).equal(0);
    expect(wrapper.vm.videoHeight).equal(0);
  });

  it('playback-rate event work fine', () => {
    wrapper.vm.$bus.$emit('playback-rate', 1);
    expect(store.state.PlaybackState.PlaybackRate).equal(1);
  });

  it('volume event work fine', () => {
    wrapper.vm.$bus.$emit('volume', 1);
    expect(store.state.PlaybackState.Volume).equal(1);
  });

  describe('calcNewWindowXY method', () => {
    let currentDisplay;
    beforeEach(() => {
      currentDisplay = {
        workArea: {
          width: 1920,
          height: 1080,
          x: 0,
          y: 0,
        },
      };
      wrapper.vm.newHeightOfWindow = 1080;
      wrapper.vm.newWidthOfWindow = 1920;
    });
    it('landingview is on the upper-left', () => {
      const landingViewRectangle = {
        x: 20,
        y: 20,
        width: 500,
        height: 500,
      };
      const spy = sinon.spy(wrapper.vm, 'calcNewWindowXY');
      wrapper.vm.calcNewWindowXY(currentDisplay, landingViewRectangle);
      expect(spy.called).equal(true);
      expect(spy.returnValues[0]).deep.equal({ windowX: 0, windowY: 0 });
      spy.restore();
    });
    it('landingview is on the upper-right', () => {
      const landingViewRectangle = {
        x: 1800,
        y: 20,
        width: 500,
        height: 500,
      };
      const spy = sinon.spy(wrapper.vm, 'calcNewWindowXY');
      wrapper.vm.calcNewWindowXY(currentDisplay, landingViewRectangle);
      expect(spy.called).equal(true);
      expect(spy.returnValues[0]).deep.equal({ windowX: 0, windowY: 0 });
      spy.restore();
    });
    it('landingview is on the bottom-left', () => {
      const landingViewRectangle = {
        x: 20,
        y: 1800,
        width: 500,
        height: 500,
      };
      const spy = sinon.spy(wrapper.vm, 'calcNewWindowXY');
      wrapper.vm.calcNewWindowXY(currentDisplay, landingViewRectangle);
      expect(spy.called).equal(true);
      expect(spy.returnValues[0]).deep.equal({ windowX: 0, windowY: 0 });
      spy.restore();
    });
    it('landingview is on the bottom-left', () => {
      const landingViewRectangle = {
        x: 1800,
        y: 1800,
        width: 500,
        height: 500,
      };
      const spy = sinon.spy(wrapper.vm, 'calcNewWindowXY');
      wrapper.vm.calcNewWindowXY(currentDisplay, landingViewRectangle);
      expect(spy.called).equal(true);
      expect(spy.returnValues[0]).deep.equal({ windowX: 0, windowY: 0 });
      spy.restore();
    });
  });

  it('onMetaLoaded method work fine if video not exist', () => {
    wrapper.vm.videoExisted = false;
    wrapper.vm.$store.commit('videoMeta', { width: 100, height: 100 });
    store.state.PlaybackState.CurrentTime = 100;

    const emitStub = sinon.stub(wrapper.vm.$bus, '$emit');
    const storeStub = sinon.stub(wrapper.vm.$store, 'commit');
    const stub = sinon.stub(wrapper.vm, '$_controlWindowSize').callsFake();

    wrapper.vm.onMetaLoaded();
    expect(emitStub.firstCall.calledWith('play')).equal(true);
    expect(emitStub.secondCall.calledWith('seek', 100)).equal(true);
    expect(emitStub.thirdCall.calledWith('video-loaded')).equal(true);
    expect(storeStub.calledWith('videoMeta')).equal(true);
    stub.restore();
    emitStub.restore();
    storeStub.restore();
  });

  it('onMetaLoaded method work fine if video exist', () => {
    wrapper.vm.videoExisted = true;
    const stub = sinon.stub(wrapper.vm, '$_controlWindowSizeAtNewVideo').callsFake();
    wrapper.vm.onMetaLoaded();
    expect(wrapper.vm.videoExisted).equal(true);
    stub.restore();
  });

  describe('$_calculateWindowSizeAtTheFirstTime', () => {
    describe('videoWidth or videoHeight is smaller than minWidth or minHeight', () => {
      let windowStub;
      beforeEach(() => {
        windowStub = sinon.stub(wrapper.vm.$store.state, 'WindowState').get(() => ({
          windowMinimumSize: [427, 240],
          windowPosition: [0, 0],
        }));
      });
      afterEach(() => {
        windowStub.restore();
      });
      it('videoRatio > minWindowRatio', () => {
        wrapper.vm.$store.commit('videoMeta', { width: 300, height: 150 });
        wrapper.vm.$_calculateWindowSizeAtTheFirstTime();
        expect(wrapper.vm.newWidthOfWindow).equal(480);
        expect(wrapper.vm.newHeightOfWindow).equal(240);
        windowStub.restore();
      });
      it('videoRatio < minWindowRatio', () => {
        wrapper.vm.$store.commit('videoMeta', { width: 150, height: 300 });
        wrapper.vm.$_calculateWindowSizeAtTheFirstTime();
        expect(wrapper.vm.newWidthOfWindow).equal(427);
        expect(wrapper.vm.newHeightOfWindow).equal(854);
      });
      it('videoRatio = minWindowRatio', () => {
        wrapper.vm.$store.commit('videoMeta', { width: 213.5, height: 120 });
        wrapper.vm.$_calculateWindowSizeAtTheFirstTime();
        expect(wrapper.vm.newWidthOfWindow).equal(427);
        expect(wrapper.vm.newHeightOfWindow).equal(240);
      });
    });

    describe('videoSize is between minSize and screenSize', () => {
      it('work fine', () => {
        const windowStub = sinon.stub(wrapper.vm.$store.state, 'WindowState').get(() => ({
          windowMinimumSize: [427, 240],
          windowPosition: [0, 0],
        }));
        wrapper.vm.$store.commit('videoMeta', { width: 450, height: 250 });
        wrapper.vm.$_calculateWindowSizeAtTheFirstTime();
        expect(wrapper.vm.newWidthOfWindow).equal(450);
        expect(wrapper.vm.newHeightOfWindow).equal(250);
        windowStub.restore();
      });
    });
  });

  describe('$_calculateWindowSizeWhenVideoExisted', () => {
    let windowStub;
    beforeEach(() => {
      windowStub = sinon.stub(wrapper.vm.$store.state, 'WindowState').get(() => ({
        windowMinimumSize: [427, 240],
        windowSize: [900, 600],
      }));
    });
    afterEach(() => {
      windowStub.restore();
    });
    it('min-size window < new video < current window', () => {
      wrapper.vm.$store.commit('videoMeta', { width: 600, height: 400 });
      wrapper.vm.$_calculateWindowSizeWhenVideoExisted();
      expect(wrapper.vm.newWidthOfWindow).equal(600);
      expect(wrapper.vm.newHeightOfWindow).equal(400);
    });
    it('videoRatio = windowRatio', () => {
      wrapper.vm.$store.commit('videoMeta', { width: 1200, height: 800 });
      wrapper.vm.$_calculateWindowSizeWhenVideoExisted();
      expect(wrapper.vm.newWidthOfWindow).equal(900);
      expect(wrapper.vm.newHeightOfWindow).equal(600);
    });
    it('videoRatio > windowRatio', () => {
      wrapper.vm.$store.commit('videoMeta', { width: 1200, height: 400 });
      wrapper.vm.$_calculateWindowSizeWhenVideoExisted();
      expect(wrapper.vm.newWidthOfWindow).equal(900);
      expect(wrapper.vm.newHeightOfWindow).equal(300);
    });
    it('videoRatio < windowRatio', () => {
      wrapper.vm.$store.commit('videoMeta', { width: 600, height: 800 });
      wrapper.vm.$_calculateWindowSizeWhenVideoExisted();
      expect(wrapper.vm.newWidthOfWindow).equal(450);
      expect(wrapper.vm.newHeightOfWindow).equal(600);
    });
    it('videoRatio > minWindowRatio', () => {
      wrapper.vm.$store.commit('videoMeta', { width: 600, height: 200 });
      wrapper.vm.$_calculateWindowSizeWhenVideoExisted();
      expect(wrapper.vm.newWidthOfWindow).equal(720);
      expect(wrapper.vm.newHeightOfWindow).equal(240);
    });
    it('videoRatio < minWindowRatio', () => {
      wrapper.vm.$store.commit('videoMeta', { width: 300, height: 400 });
      wrapper.vm.$_calculateWindowSizeWhenVideoExisted();
      expect(wrapper.vm.newWidthOfWindow).equal(427);
      expect(wrapper.vm.newHeightOfWindow).equal(427 / 0.75);
    });
  });
});
