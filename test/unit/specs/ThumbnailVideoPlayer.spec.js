import ThumbnailVideoPlayer from '@/components/PlayingView/ThumbnailVideoPlayer';
import BaseVideoPlayer from '@/components/PlayingView/BaseVideoPlayer';
import ThumbnailWorker from '@/worker/thumbnail.worker';
import { shallowMount } from '@vue/test-utils';
import sinon from 'sinon';

describe('Component - ThumbnailVideoPlayer', () => {
  let wrapper;
  let sandbox;
  const propsData = {
    currentTime: 0,
    channelName: 'thumbnail',
    outerThumbnailInfo: {
      videoSrc: 'file:///',
      videoDuration: 0,
      generationInterval: 0,
      screenWidth: 1920,
    },
  };

  it('sanity-test - should render BaseVideoPlayer properly', () => {
    wrapper = shallowMount(ThumbnailVideoPlayer, { propsData });

    const baseVideoPlayer = wrapper.find(BaseVideoPlayer);

    expect(baseVideoPlayer.is(BaseVideoPlayer)).to.equal(true);
  });

  describe.only('Behavior - Should start autoGeneration when shallowMounted', () => {
    beforeEach(() => {
      wrapper = shallowMount(ThumbnailVideoPlayer, { propsData });
      sandbox = sinon.createSandbox();
    });
    afterEach(() => {
      wrapper.destroy();
      sandbox.restore();
    });

    it('should valid currentTime be normalized as correct auto generation start index', () => {
      const currentTimes = [0, 29.35, 751, 90];
      const intervals = [20, 3, 2, 3];
      const expectedResults = [0, 9, 375, 30];

      currentTimes.forEach((testCase, index) => {
        const newPropsData = Object.assign(
          {},
          propsData,
          { generationInterval: intervals[index] },
          { currentTime: testCase },
          { thumbnailWorker: new ThumbnailWorker() },
        );
        wrapper.setProps(newPropsData);
        expect(wrapper.vm.autoGenerationIndex).to.equal(expectedResults[index]);
      });
    });
    it('should zero currentTime only accept screenWidth props', () => {

    });
    it('should non-zero currentTime video use props as generation parameters', () => {

    });
    it('should auto generation be started upon shallowMounted', () => {

    });
  });
});
