import { mount } from '@vue/test-utils';
import sinon from 'sinon';
import ThumbnailDisplay from '@/components/PlayingView/ThumbnailDisplay.vue';

describe('Component - ThumbnailDisplay', () => {
  let wrapper;
  let sandbox;
  const propsData = {
    currentTime: 0,
  };
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    wrapper = mount(ThumbnailDisplay, { propsData });
  });
  afterEach(() => {
    wrapper.destroy();
    sandbox.restore();
  });
});
