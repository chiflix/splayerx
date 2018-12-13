import Vuex from 'vuex';
import Window from '@/store/modules/Window';
import Video from '@/store/modules/Video';
import Input from '@/store/modules/Input';
import TheVideoController from '@/components/PlayingView/TheVideoController';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import sinon from 'sinon';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Component - TheVideoController Unit Test', () => {
  let wrapper;
  let sandbox;
  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        Window: {
          state: Window.state,
          mutations: Window.mutations,
        },
        Video: {
          getters: Video.getters,
        },
        Input: {
          state: Input.state,
          mutations: Input.mutations,
          actions: Input.actions,
          getters: Input.getters,
        },
      },
    });
    wrapper = shallowMount(TheVideoController, { store, localVue });
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    wrapper.destroy();
    sandbox.restore();
  });

  it('Sanity - should component be properly mounted', () => {
    expect(wrapper.contains(TheVideoController)).to.equal(true);
  });

  describe('should inputProcess function normally', () => {
    let currentEventInfo;
    let lastEventInfo;
    beforeEach(() => {
      currentEventInfo = new Map([
        ['mousemove', {}],
        ['mousedown', {}],
        ['mouseup', {}],
        ['mouseenter', {}],
        ['wheel', {}],
        ['keydown', {
          ArrowUp: false,
          ArrowDown: false,
          ArrowLeft: false,
          ArrowRight: false,
          Space: false,
          KeyM: false,
        }],
      ]);
      lastEventInfo = new Map(currentEventInfo);
    });

    describe('hideVolume timer', () => {
      const hideVolumeTimerName = 'sleepingVolumeButton';
      const hideVolumeTimerTime = 1000;
      it('should timer be updated when ArrowUp/ArrowDown keypressed', () => {
        currentEventInfo.set('keydown', { ArrowUp: true });
        lastEventInfo.set('keydown', { ArrowDown: true });

        wrapper.vm.UITimerManager(17);
        wrapper.vm.inputProcess(currentEventInfo, lastEventInfo);

        expect(wrapper.vm.timerManager.getTimer(hideVolumeTimerName))
          .to.deep.equal({ name: hideVolumeTimerName, timeLeft: hideVolumeTimerTime });
      });
      it('should timer be updated when mouse scrolls', () => {
        currentEventInfo.set('wheel', { time: Date.now() });
        lastEventInfo.set('wheel', { time: Date.now() - 20 });

        wrapper.vm.UITimerManager(17);
        wrapper.vm.inputProcess(currentEventInfo, lastEventInfo);

        if (process.platform !== 'darwin') {
          expect(wrapper.vm.timerManager.getTimer(hideVolumeTimerName))
            .to.deep.equal({ name: hideVolumeTimerName, timeLeft: hideVolumeTimerTime });
        }
      });
    });
  });
});
