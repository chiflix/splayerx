import BaseImageDisplay from '@/components/PlayingView/BaseImageDisplay';
import { mount } from '@vue/test-utils';
import sinon from 'sinon';

describe('Component - BaseImageDisplay', () => {
  let sandbox;
  let wrapper;

  it('sanity - should BaseImageDisplay be rendered properly', () => {
    wrapper = mount(BaseImageDisplay, { props: { imgSrc: 'https://' } });

    expect(wrapper.contains(BaseImageDisplay)).to.equal(true);
  });

  describe('Functionality - DataURI/URL image test', () => {
    const propsData = {
      imgSrc: 'data:image/gif;',
    };
    beforeEach(() => {
      sandbox = sinon.createSandbox();
      wrapper = mount(BaseImageDisplay, { propsData });
    });
    afterEach(() => {
      sandbox.restore();
      wrapper.destroy();
    });

    it('should render img properly', () => {
      expect(wrapper.vm.imageType).to.equal('DataURI');
    });
  });
});
