import ThumbnailDisplay from '@/components/PlayingView/ThumbnailDisplay';
import { mount } from '@vue/test-utils';
import sinon from 'sinon';

describe('Component - ThumbnailDisplay', () => {
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
    autoGenerationIndex: 1,
  };

  beforeEach(() => {
    wrapper = mount(ThumbnailDisplay, { propsData });
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    wrapper.destroy();
    sandbox.restore();
  });

  describe('Behavior - AutoGenerationIndex changing', () => {
    it('should changing autoGenerationIndex turn off base-image-display', () => {
      wrapper.setProps({ autoGenerationIndex: 30 });

      expect(wrapper.vm.imageReady).to.equal(false);
    });

    it('should changing autoGenerationIndex update thumbnailMap', (done) => {
      const getThumbnailFake = sandbox.fake.resolves([{ index: 1, thumbnail: '1' }]);
      wrapper.vm.getThumbnail = getThumbnailFake;

      wrapper.setProps({ autoGenerationIndex: 2 });

      wrapper.vm.$nextTick(() => {
        wrapper.vm.$emit('image-all-get');
        expect(wrapper.vm.thumbnailMap).to.have.key(1);
        done();
      });
    });
  });

  describe('Behavior - CurrentIndex change', () => {
    it('should already have index get proper image', () => {
      const testObject = {
        index: 30,
        thumbnail: '30',
      };
      wrapper.vm.thumbnailMap.set(testObject.index, testObject);

      wrapper.setProps({ currentIndex: 30 });

      expect(wrapper.vm.image).to.deep.equal(testObject);
    });

    it('should image-all-get refresh ungenerated image', () => {
      const testObject = {
        index: 30,
        thumbnail: '30',
      };

      wrapper.setProps({ currentIndex: 30 });
      expect(wrapper.vm.image).to.not.equal(testObject);
      wrapper.vm.thumbnailMap.set(testObject.index, testObject);
      wrapper.vm.$emit('image-all-get');

      expect(wrapper.vm.image).to.deep.equal(testObject);
    });
  });
});
