import ThumbnailVideoPlayer from '@/components/PlayingView/ThumbnailVideoPlayer.vue';
import BaseVideoPlayer from '@/components/PlayingView/BaseVideoPlayer.vue';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import Video from '@/store/modules/Video';
import Vuex from 'vuex';
import sinon from 'sinon';

describe('Component - ThumbnailVideoPlayer', () => {
  let wrapper;
  let sandbox;
  const store = new Vuex.Store({
    modules: {
      Video: {
        state: Video.state,
        mutations: Video.mutations,
        getters: Video.getters,
      },
    },
  });
  const localVue = createLocalVue();
  localVue.use(Vuex);
  const propsData = {
    currentTime: 0,
    outerThumbnailInfo: {
      newVideo: true,
      videoSrc: 'file:///',
      videoDuration: 0,
      videoRatio: 1.78,
      generationInterval: 0,
      screenWidth: 1920,
      maxThumbnailWidth: 240,
      maxThumbnailCount: 100,
    },
  };

  it('Sanity - should render BaseVideoPlayer properly', () => {
    wrapper = shallowMount(ThumbnailVideoPlayer, { propsData, store, localVue });

    const baseVideoPlayer = wrapper.find(BaseVideoPlayer);

    expect(baseVideoPlayer.is(BaseVideoPlayer)).to.equal(true);
  });

  describe('Behavior - Should start autoGeneration when mounted', () => {
    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });
    afterEach(() => {
      sandbox.restore();
    });

    it('should opened file take lastGenerationIndex as correct auto generation start index', () => {
      const newPropsData = Object.assign(
        {},
        propsData,
        {
          outerThumbnailInfo: Object.assign(
            {},
            propsData.outerThumbnailInfo,
            {
              newVideo: false,
              lastGenerationIndex: 75,
            },
          ),
        },
      );

      wrapper = shallowMount(ThumbnailVideoPlayer, { propsData: newPropsData, store, localVue });

      expect(wrapper.vm.autoGenerationIndex)
        .to.equal(newPropsData.outerThumbnailInfo.lastGenerationIndex);
    });
    it('should new video file only accept screenWidth props', () => {
      const screenWidths = [720, 1024, 4096, 800];
      const intervals = [200, 384, 4, 7];
      screenWidths.forEach((testCase, index) => {
        const newPropsData = Object.assign(
          {},
          propsData,
          {
            outerThumbnailInfo: Object.assign(
              {},
              propsData.outerThumbnailInfo,
              {
                generationInterval: intervals[index],
                videoDuration: 800,
                screenWidth: testCase,
              },
            ),
          },
        );

        const tempWrapper = shallowMount(
          ThumbnailVideoPlayer,
          { propsData: newPropsData, store, localVue },
        );

        expect(tempWrapper.vm.screenWidth).to.equal(testCase);
        expect(tempWrapper.vm.autoGenerationIndex).to.equal(0);
        expect(tempWrapper.vm.videoDuration)
          .to.not.equal(newPropsData.outerThumbnailInfo.videoDuration);
      });
    });
    it('should auto generation be started upon mounted', () => {
      const wrapper = shallowMount(ThumbnailVideoPlayer, { propsData, store, localVue });

      expect(wrapper.vm.isAutoGeneration).to.equal(true);
    });
  });

  describe('Behavior - Should auto generation function normally', () => {
    beforeEach(() => {
      sandbox = sinon.createSandbox();
      wrapper = shallowMount(ThumbnailVideoPlayer, { propsData, store, localVue });
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

  describe('Behavior - Should autoGeneration and manualGeneration switch properly', () => {
    let generationClock;
    beforeEach(() => {
      sandbox = sinon.createSandbox();
      generationClock = sandbox.useFakeTimers();
      wrapper = shallowMount(ThumbnailVideoPlayer, { propsData, store, localVue });
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

      expect(wrapper.vm.autoGenerationIndex).to.equal(0);
    });
  });
});
