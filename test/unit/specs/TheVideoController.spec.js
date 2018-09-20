import TheVideoController from '@/components/PlayingView/TheVideoController';
import { shallowMount } from '@vue/test-utils';
import sinon from 'sinon';

describe('Component - TheVideoController Unit Test', () => {
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
});
