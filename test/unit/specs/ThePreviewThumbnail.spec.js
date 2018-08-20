import ThePreviewThumbnail from '@/components/PlayingView/ThePreviewThumbnail';
import { shallowMount } from '@vue/test-utils';
import sinon from 'sinon';

describe('Component - ThePreviewThumbnail', () => {
  let wrapper;
  let sandbox;

  it('Sanity - should ThePreviewThumbnail be rendered', () => {
    wrapper = shallowMount(ThePreviewThumbnail);

    expect(wrapper.contains(ThePreviewThumbnail)).to.equal(true);
  });

  const propsData = {
    src: 'file:///',
    currentTime: 0,
    maxThumbnailWidth: 240,
    videoRatio: 1.78,
    thumbnailWidth: 135,
    thumbnailHeight: 76,
  };
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    wrapper = shallowMount(ThePreviewThumbnail, { propsData });
  });
  afterEach(() => {
    wrapper.destroy();
    sandbox.restore();
  });

  it('should switch src reload ThumbnailDisplay and ThumbnailVideoPlayer', () => {
    wrapper.setProps({ src: 'http:///' });

    expect(wrapper.vm.mountVideo && wrapper.vm.mountImage).to.equal(false);
  });
});
