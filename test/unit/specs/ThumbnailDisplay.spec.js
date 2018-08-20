import ThumbnailDisplay from '@/components/PlayingView/ThumbnailDisplay';
import { mount } from '@vue/test-utils';
import sinon from 'sinon';

describe.only('Component - ThumbnailDisplay', () => {
  let wrapper;
  let sandbox;

  it('sanity - should render ThumbnailDisplay', () => {
    wrapper = mount(ThumbnailDisplay);

    expect(wrapper.contains(ThumbnailDisplay)).to.equal(true);
  });

  const quickHash = '84f0e9e5e05f04b58f53e2617cc9c866-'
                  + 'f54d6eb31bef84839c3ce4fc2f57991c-'
                  + 'b1f0696aec64577228d93eabcc8eb69b-'
                  + 'f497c6684c4c6e50d0856b5328a4bedc';
  const propsData = {
    quickHash,
    maxThumbnailWidth: 240,
    maxThumbnailHeight: 135,
  };

  beforeEach(() => {
    wrapper = mount(ThumbnailDisplay, { propsData });
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    wrapper.destroy();
    sandbox.restore();
  });
});
