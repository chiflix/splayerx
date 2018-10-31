import Vuex from 'vuex';
import WindowState from '@/store/modules/WindowState';
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
        WindowState: {
          state: WindowState.state,
          mutations: WindowState.mutations,
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

  it('should event handlers be properly invoked', () => {
    const events = [
      'mousemove',
      'mouseenter',
      'mouseleave',
      'mousedown.left',
      'mousedown.right',
      'mouseup.left',
      'dblclick',
    ];

    events.forEach((event) => {
      const oldEventInfo = wrapper.vm.eventInfo.get(event.split('.')[0]);

      wrapper.trigger(event);
      const newInfo = wrapper.vm.eventInfo.get(event.split('.')[0]);

      if (newInfo) { expect(oldEventInfo).to.not.equal(newInfo); }
    });
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
    describe('mousemove timer', () => {
      const position = [0, 0];
      const mousemoveTimerName = 'mouseStopMoving';
      it('should different mousemove position set mouseStopMoving to false', () => {
        const differentPosition = [1, 1];
        currentEventInfo.set('mousemove', { position });
        lastEventInfo.set('mousemove', { position: differentPosition });

        wrapper.vm.inputProcess(currentEventInfo, lastEventInfo);

        expect(wrapper.vm.mouseStopMoving).to.equal(false);
      });
      it('should different mousemove position reset mouseStopMoving timer', () => {
        const differentPosition = [1, 1];
        currentEventInfo.set('mousemove', { position });
        const lastMousemoveTimer = wrapper.vm.timerManager.getTimer(mousemoveTimerName);
        lastEventInfo.set('mousemove', { position: differentPosition });

        wrapper.vm.UITimerManager(17);
        wrapper.vm.inputProcess(currentEventInfo, lastEventInfo);
        const currentMousemoveTimer = wrapper.vm.timerManager.getTimer(mousemoveTimerName);

        expect(lastMousemoveTimer).to.deep.equal(currentMousemoveTimer);
      });
      it('should same mousemove position set mouseStopMoving to true', () => {
        currentEventInfo.set('mousemove', { position });
        lastEventInfo.set('mousemove', { position });

        wrapper.vm.inputProcess(currentEventInfo, lastEventInfo);

        expect(wrapper.vm.mouseStopMoving).to.equal(true);
      });
      it('should same mousemove position do not reset mouseStopMoving timer', () => {
        currentEventInfo.set('mousemove', { position });
        const lastMousemoveTimer = wrapper.vm.timerManager.getTimer(mousemoveTimerName);
        lastEventInfo.set('mousemove', { position });

        wrapper.vm.UITimerManager(17);
        wrapper.vm.inputProcess(currentEventInfo, lastEventInfo);
        const currentMousemoveTimer = wrapper.vm.timerManager.getTimer(mousemoveTimerName);

        expect(lastMousemoveTimer).to.not.deep.equal(currentMousemoveTimer);
      });
    });
    describe('mouseenter timer', () => {
      const mouseenterTimerName = 'mouseLeavingWindow';
      it('should mouseenterTimer be added when mouseLeavingWindow', () => {
        const mouseenterTimerTime = wrapper.vm.mouseleftDelay;
        currentEventInfo.set('mouseenter', { mouseLeavingWindow: true });
        lastEventInfo.set('mouseenter', { mouseLeavingWindow: false });

        wrapper.vm.inputProcess(currentEventInfo, lastEventInfo);

        expect(wrapper.vm.timerManager.getTimer(mouseenterTimerName))
          .to.deep.equal({ name: mouseenterTimerName, timeLeft: mouseenterTimerTime });
      });
      it('should mouseenterTimer be removed when changed and mouse not leaving window', () => {
        currentEventInfo.set('mouseenter', { mouseLeavingWindow: false });
        lastEventInfo.set('mouseenter', { mouseLeavingWindow: true });

        wrapper.vm.inputProcess(currentEventInfo, lastEventInfo);

        expect(wrapper.vm.timerManager.getTimer(mouseenterTimerName)).to.equal(null);
        expect(wrapper.vm.mouseLeftWindow).to.equal(false);
      });
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

        expect(wrapper.vm.timerManager.getTimer(hideVolumeTimerName))
          .to.deep.equal({ name: hideVolumeTimerName, timeLeft: hideVolumeTimerTime });
      });
      it('should mousemove timer be reset when hideProgressBar event happened', () => {
        const mousemoveTimerName = 'mouseStopMoving';
        const mousemoveTiemrTime = wrapper.vm.mousestopDelay;
        currentEventInfo.set('wheel', { time: Date.now() });
        currentEventInfo.set('mousemove', { position: [1, 1] });
        lastEventInfo.set('wheel', { time: Date.now() - 20 });
        lastEventInfo.set('mousemove', { position: [0, 0] });

        wrapper.vm.UITimerManager(17);
        wrapper.vm.inputProcess(currentEventInfo, lastEventInfo);

        expect(wrapper.vm.timerManager.getTimer(mousemoveTimerName))
          .to.deep.equal({ name: mousemoveTimerName, timeLeft: mousemoveTiemrTime });
      });
    });
    describe('hideProgressBar timer', () => {
      const hideProgressBarTimerName = 'sleepingProgressBar';
      const hideProgressBarTimerTime = 3000;
      it('should timer be updated when ArrowLeft/ArrowRight keypressed', () => {
        currentEventInfo.set('keydown', { ArrowLeft: true });
        lastEventInfo.set('keydown', { ArrowRight: true });

        wrapper.vm.UITimerManager(17);
        wrapper.vm.inputProcess(currentEventInfo, lastEventInfo);

        expect(wrapper.vm.timerManager.getTimer(hideProgressBarTimerName))
          .to.deep.equal({ name: hideProgressBarTimerName, timeLeft: hideProgressBarTimerTime });
      });
      it('should mousemove timer be reset when hideProgressBar event happened', () => {
        const mousemoveTimerName = 'mouseStopMoving';
        const mousemoveTiemrTime = wrapper.vm.mousestopDelay;
        currentEventInfo.set('keydown', { ArrowLeft: true });
        currentEventInfo.set('mousemove', { position: [1, 1] });
        lastEventInfo.set('keydown', { ArrowRight: true });
        lastEventInfo.set('mousemove', { position: [0, 0] });

        wrapper.vm.UITimerManager(17);
        wrapper.vm.inputProcess(currentEventInfo, lastEventInfo);

        expect(wrapper.vm.timerManager.getTimer(mousemoveTimerName))
          .to.deep.equal({ name: mousemoveTimerName, timeLeft: mousemoveTiemrTime });
      });
    });
  });
});
