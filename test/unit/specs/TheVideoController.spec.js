import TheVideoController from '@/components/PlayingView/TheVideoController';
import { shallowMount } from '@vue/test-utils';

describe.only('Component - TheVideoController Unit Test', () => {
  it('Sanity - should component be properly mounted', () => {
    const wrapper = shallowMount(TheVideoController);

    expect(wrapper.contains(TheVideoController)).to.equal(true);
  });
});
