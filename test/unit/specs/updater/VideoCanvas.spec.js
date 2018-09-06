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
    expect(wrapper.vm.windowRectangleOld).to.be.an('object');
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

  it('calcNewWindowXY method work fine if no windowRectangleOld exist', () => {
    wrapper.vm.windowRectangleOld = {};
    const spy = sinon.spy(wrapper.vm, 'calcNewWindowXY');
    wrapper.vm.calcNewWindowXY();
    expect(spy.called).equal(true);
    expect(spy.returnValues[0]).deep.equal({ windowX: 0, windowY: 0 });
    spy.restore();
  });

  it('watch OriginSrcOfVideo work fine', () => {
    const stub = sinon.stub(wrapper.vm.$electron.remote, 'getCurrentWindow').callsFake(() => ({
      getBounds() {
        return {
          x: 10,
          y: 10,
          width: 10,
          height: 10,
        };
      },
    }));

    wrapper.vm.$store.commit('OriginSrcOfVideo', 'abc');

    expect(wrapper.vm.windowRectangleOld.x).equal(10);
    expect(wrapper.vm.windowRectangleOld.y).equal(10);
    expect(wrapper.vm.windowRectangleOld.height).equal(10);
    expect(wrapper.vm.windowRectangleOld.width).equal(10);
    stub.restore();
  });

  it('calcNewWindowXY method work fine if windowRectangelOld exist', () => {
    wrapper.vm.windowRectangleOld = {
      x: 10,
      y: 10,
      width: 100,
      height: 100,
    };
    wrapper.vm.newHeightOfWindow = wrapper.vm.newWidthOfWindow = 100;
    const spy = sinon.spy(wrapper.vm, 'calcNewWindowXY');
    wrapper.vm.calcNewWindowXY();
    expect(spy.called).equal(true);
    expect(spy.returnValues[0]).deep.equal({ windowX: 10, windowY: 10 });
    spy.restore();
  });

  it('onMetaLoaded method work fine if video not exist', () => {
    wrapper.vm.videoExisted = false;
    wrapper.vm.videoWidth = 100;
    wrapper.vm.videoHeight = 100;
    store.state.PlaybackState.CurrentTime = 100;

    const emitStub = sinon.stub(wrapper.vm.$bus, '$emit');
    const stub = sinon.stub(wrapper.vm, '$_controlWindowSize').callsFake();

    wrapper.vm.onMetaLoaded();
    expect(emitStub.firstCall.calledWith('play')).equal(true);
    expect(emitStub.secondCall.calledWith('seek', 100)).equal(true);
    expect(emitStub.thirdCall.calledWith('screenshot-sizeset')).equal(true);
    expect(wrapper.vm.videoExisted).equal(true);
    stub.restore();
    emitStub.restore();
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
        windowStub = sinon.stub(wrapper.vm.$electron.remote, 'getCurrentWindow').callsFake(() => ({
          getMinimumSize() {
            return [427, 240];
          },
        }));
      });
      afterEach(() => {
        windowStub.restore();
      });
      it('videoRatio > minWindowRatio', () => {
        wrapper.vm.videoWidth = 300;
        wrapper.vm.videoHeight = 150;
        wrapper.vm.$_calculateWindowSizeAtTheFirstTime();
        expect(wrapper.vm.newWidthOfWindow).equal(480);
        expect(wrapper.vm.newHeightOfWindow).equal(240);
        windowStub.restore();
      });
      it('videoRatio < minWindowRatio', () => {
        wrapper.vm.videoWidth = 150;
        wrapper.vm.videoHeight = 300;
        wrapper.vm.$_calculateWindowSizeAtTheFirstTime();
        expect(wrapper.vm.newWidthOfWindow).equal(427);
        expect(wrapper.vm.newHeightOfWindow).equal(854);
      });
      it('videoRatio = minWindowRatio', () => {
        wrapper.vm.videoWidth = 213.5;
        wrapper.vm.videoHeight = 120;
        wrapper.vm.$_calculateWindowSizeAtTheFirstTime();
        expect(wrapper.vm.newWidthOfWindow).equal(427);
        expect(wrapper.vm.newHeightOfWindow).equal(240);
      });
    });

    describe('videoSize is between minSize and screenSize', () => {
      it('work fine', () => {
        const windowStub = sinon.stub(wrapper.vm.$electron.remote, 'getCurrentWindow').callsFake(() => ({
          getMinimumSize() {
            return [427, 240];
          },
        }));
        wrapper.vm.videoWidth = 450;
        wrapper.vm.videoHeight = 250;
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
      windowStub = sinon.stub(wrapper.vm.$electron.remote, 'getCurrentWindow').callsFake(() => ({
        getMinimumSize() {
          return [427, 240];
        },
        getSize() {
          return [900, 600];
        },
      }));
    });
    afterEach(() => {
      windowStub.restore();
    });
    it('min-size window < new video < current window', () => {
      wrapper.vm.videoWidth = 600;
      wrapper.vm.videoHeight = 400;
      wrapper.vm.$_calculateWindowSizeWhenVideoExisted();
      expect(wrapper.vm.newWidthOfWindow).equal(600);
      expect(wrapper.vm.newHeightOfWindow).equal(400);
    });
    it('videoRatio = windowRatio', () => {
      wrapper.vm.videoWidth = 1200;
      wrapper.vm.videoHeight = 800;
      wrapper.vm.$_calculateWindowSizeWhenVideoExisted();
      expect(wrapper.vm.newWidthOfWindow).equal(900);
      expect(wrapper.vm.newHeightOfWindow).equal(600);
    });
    it('videoRatio > windowRatio', () => {
      wrapper.vm.videoWidth = 1200;
      wrapper.vm.videoHeight = 400;
      wrapper.vm.$_calculateWindowSizeWhenVideoExisted();
      expect(wrapper.vm.newWidthOfWindow).equal(900);
      expect(wrapper.vm.newHeightOfWindow).equal(300);
    });
    it('videoRatio < windowRatio', () => {
      wrapper.vm.videoWidth = 600;
      wrapper.vm.videoHeight = 800;
      wrapper.vm.$_calculateWindowSizeWhenVideoExisted();
      expect(wrapper.vm.newWidthOfWindow).equal(450);
      expect(wrapper.vm.newHeightOfWindow).equal(600);
    });
    it('videoRatio > minWindowRatio', () => {
      wrapper.vm.videoWidth = 600;
      wrapper.vm.videoHeight = 200;
      wrapper.vm.$_calculateWindowSizeWhenVideoExisted();
      expect(wrapper.vm.newWidthOfWindow).equal(720);
      expect(wrapper.vm.newHeightOfWindow).equal(240);
    });
    it('videoRatio < minWindowRatio', () => {
      wrapper.vm.videoWidth = 300;
      wrapper.vm.videoHeight = 400;
      wrapper.vm.$_calculateWindowSizeWhenVideoExisted();
      expect(wrapper.vm.newWidthOfWindow).equal(427);
      expect(wrapper.vm.newHeightOfWindow).equal(427 / 0.75);
    });
  });
});
