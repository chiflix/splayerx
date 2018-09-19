import TheVideoController from '@/components/PlayingView/TheVideoController';
import { shallowMount } from '@vue/test-utils';
import sinon from 'sinon';

describe.only('Component - TheVideoController Unit Test', () => {
  it('Sanity - should component be properly mounted', () => {
    const wrapper = shallowMount(TheVideoController);

    expect(wrapper.contains(TheVideoController)).to.equal(true);
  });

  let wrapper;
  let sandbox;

  beforeEach(() => {
    wrapper = shallowMount(TheVideoController);
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    wrapper.destroy();
    sandbox.restore();
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
        ['mouseenter', {}],
        ['wheel', {}],
        ['keydown', {
          ArrowUp: false,
          ArrowDown: false,
          ArrowLeft: false,
          ArrowRight: false,
          Space: false,
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
  });
});
