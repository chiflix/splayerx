import ThumbnailVideoPlayer from '@/components/PlayingView/ThumbnailVideoPlayer';
import BaseVideoPlayer from '@/components/PlayingView/BaseVideoPlayer';
import { shallowMount } from '@vue/test-utils';
import sinon from 'sinon';

describe.only('Component - ThumbnailVideoPlayer', () => {
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

  describe('Behavior - Should start autoGeneration when shallowMounted', () => {
    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });
    afterEach(() => {
      sandbox.restore();
    });

    it('should valid currentTime be normalized as correct auto generation start index', () => {
      const currentTimes = [0, 29.35, 751, 90];
      const intervals = [20, 3, 2, 3];
      const expectedResults = [0, 9, 375, 30];

      currentTimes.forEach((testCase, index) => {
        const newPropsData = {
          currentTime: testCase,
          channelName: 'thumbnail',
          outerThumbnailInfo: {
            videoSrc: 'file:///',
            videoDuration: 2000,
            generationInterval: intervals[index],
            screenWidth: 1920,
          },
        };
        const tempWrapper = shallowMount(ThumbnailVideoPlayer, { propsData: newPropsData });
        expect(tempWrapper.vm.autoGenerationIndex).to.equal(expectedResults[index]);
      });
    });
    it('should zero currentTime only accept screenWidth props', () => {
      const screenWidths = [720, 1024, 4096, 800];
      const intervals = [200, 384, 4, 7];
      screenWidths.forEach((testCase, index) => {
        const newPropsData = {
          currentTime: 0,
          channelName: 'thumbnail',
          outerThumbnailInfo: {
            videoSrc: 'file:///',
            videoDuration: 800,
            generationInterval: intervals[index],
            screenWidth: testCase,
          },
        };

        const tempWrapper = shallowMount(ThumbnailVideoPlayer, { propsData: newPropsData });

        expect(tempWrapper.vm.screenWidth).to.equal(testCase);
        expect(tempWrapper.vm.videoDuration)
          .to.not.equal(newPropsData.outerThumbnailInfo.videoDuration);
        expect(tempWrapper.vm.generationInterval).to.not.equal(intervals[index]);
      });
    });
    it('should non-zero currentTime video use props as generation parameters', () => {
      const currentTimes = [760, 4000, 751, 90];
      const screenWidths = [720, 1024, 4096, 800];
      const intervals = [200, 384, 4, 7];
      currentTimes.forEach((testCase, index) => {
        const newPropsData = {
          currentTime: testCase,
          channelName: 'thumbnail',
          outerThumbnailInfo: {
            videoSrc: 'file:///',
            videoDuration: 800,
            generationInterval: intervals[index],
            screenWidth: screenWidths[index],
          },
        };

        const tempWrapper = shallowMount(ThumbnailVideoPlayer, { propsData: newPropsData });

        expect(tempWrapper.vm.screenWidth).to.equal(screenWidths[index]);
        expect(tempWrapper.vm.generationInterval).to.equal(intervals[index]);
        expect(tempWrapper.vm.videoDuration)
          .to.equal(newPropsData.outerThumbnailInfo.videoDuration);
      });
    });
    it('should auto generation be started upon shallowMounted', () => {
      const wrapper = shallowMount(ThumbnailVideoPlayer, { propsData });

      expect(wrapper.vm.isAutoGeneration).to.equal(true);
    });
  });

  describe('Behavior - Should auto generation function normally', () => {
    beforeEach(() => {
      sandbox = sinon.createSandbox();
      wrapper = shallowMount(ThumbnailVideoPlayer, { propsData });
    });
    afterEach(() => {
      sandbox.restore();
    });

    it('should properly changed currentTime stop auto generation', () => {
      wrapper.setProps({ currentTime: 76 });

      expect(wrapper.vm.isAutoGeneration).to.equal(false);
    });
    it('should valid changed currentTime in set be ignored', () => {
      wrapper.vm.thumbnailSet.add(25);
      wrapper.setProps({ currentTime: 76 });

      expect(wrapper.vm.isAutoGeneration).to.equal(true);
    });
    it('should invalid changed currentTime be ignored', () => {
      wrapper.setProps({ currentTime: NaN });

      expect(wrapper.vm.isAutoGeneration).to.equal(true);
    });
  });

  describe.only('Behavior - Should autoGeneration and manualGeneration switch properly', () => {
    let generationClock;
    beforeEach(() => {
      sandbox = sinon.createSandbox();
      generationClock = sandbox.useFakeTimers();
      wrapper = shallowMount(ThumbnailVideoPlayer, { propsData });
    });
    afterEach(() => {
      sandbox.restore();
      generationClock.restore();
    });

    it('should auto generation be resumed after MAX_GENERARION_DELAY', () => {
      const delay = wrapper.vm.MAX_GENERATION_DELAY;
      const pauseGenerationSpy = sandbox.spy(wrapper.vm, 'pauseAutoGeneration');

      wrapper.setProps({ currentTime: 75 });
      generationClock.tick(delay);

      sinon.assert.calledOnce(pauseGenerationSpy);
      expect(wrapper.vm.isAutoGeneration).to.equal(true);
    });
    it('should unstoppable currentTime pause autoGeneration consistently', () => {
      const delay = wrapper.vm.MAX_GENERATION_DELAY;
      const currentTimes = [79, 94, 104, 9000];
      currentTimes.forEach((testCase) => {
        wrapper.setProps({ currentTime: testCase });

        generationClock.tick(delay - 5);
        expect(wrapper.vm.isAutoGeneration).to.equal(false);
      });
    });
    it('should manualGeneration have proper manualGenerationIndex', () => {
      const currentTimes = [79, 94, 104, 9000];
      const expectedResults = [26, 31, 34, 3000];
      currentTimes.forEach((testCase, index) => {
        wrapper.setProps({ currentTime: testCase });

        expect(wrapper.vm.manualGenerationIndex).to.equal(expectedResults[index]);
      });
    });
    it('should resumed autoGeneration have proper autoGenerationIndex restored', () => {
      wrapper.setProps({ currentTime: 97 });

      generationClock.tick(wrapper.vm.MAX_GENERATION_DELAY + 10);

      expect(wrapper.vm.autoGenerationIndex).to.equal(-1);
    });
  });
});
