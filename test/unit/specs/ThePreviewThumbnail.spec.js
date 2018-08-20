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
});
