import BaseVideoPlayer from '@/components/PlayingView/BaseVideoPlayer';
import { mount } from '@vue/test-utils';
import sinon from 'sinon';
describe.only('Component - BaseVideoPlayer', () => {
  const propsData = {
    src: 'file:///',
    events: ['loadedmetadata'],
  };

  it('sanity - should render video element', () => {
    const wrapper = mount(BaseVideoPlayer, { propsData });

    expect(wrapper.contains('video')).to.equal(true);
  });

  describe('Props', () => {
    let sandbox;
    let wrapper;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      wrapper = mount(BaseVideoPlayer, {
        propsData,
      });
    });
    afterEach(() => {
      sandbox.restore();
      wrapper.destroy();
    });

    it('should video playbackrate be set dynamically', () => {
      const playbackrates = [0.8, 1.0, 5.4];

      playbackrates.forEach((testCase) => {
        wrapper.setProps({ playbackRate: testCase });
        const currentPlaybackRate = wrapper.find('video').attributes().playbackRate;

        expect(currentPlaybackRate).to.equal(testCase.toString());
      });
    });

    it('should video src not be set dynamically', () => {
      const srcs = [
        'file:///Users/treve/Documents/Projects/splayerx/test/assets/mediaQuickHash_test.avi',
        'file://Z:/Documents/testVideoFiles/mediaQuickHash_test.avi',
        'http://youtube.com/s/sjdfhsjkdfhsk/',
      ];

      srcs.forEach((testCase) => {
        wrapper.setProps({ src: testCase });

        const srcResult = wrapper.find('video').attributes().src;

        expect(srcResult).to.equal(propsData.src);
      });
    });
    it('should invalid video src be ignored', () => {
      const invalidSrcs = [
        '',
        'thunder://hahahaha',
        'it is an invalid url',
        'htps',
      ];

      invalidSrcs.forEach((testCase) => {
        wrapper.setProps({ src: testCase });

        const srcResult = wrapper.find('video').attributes().src;

        expect(srcResult).to.equal(propsData.src);
      });
    });

    it('should video volume be set dynamically', () => {
      const volumes = [0, 0.4, 0.7, 0.999, 1];

      volumes.forEach((testCase) => {
        wrapper.setProps({ volume: testCase });

        const volumeResult = wrapper.find('video').attributes().volume;

        expect(volumeResult).to.equal(testCase.toString());
      });
    });
    it('should invalid video volume be ignored', () => {
      const invalidVolumes = [-1, -9, NaN, Infinity, 3];

      invalidVolumes.forEach((testCase) => {
        wrapper.setProps({ volume: testCase });

        const volumeResult = wrapper.find('video').attributes().volume;

        expect(volumeResult).to.equal(wrapper.vm.$options.props.volume.default.toString());
      });
    });

    it('should events be initialized', () => {
      expect(wrapper.vm.onEdEvents).to.deep.equal(propsData.events);
    });
    it('should events cannot change after initialized', () => {
      const events = [
        ['loadedmetadata', 'canplay'],
        ['dataloaded', 'canplaythrough'],
        [
          'abort',
          'canplay',
          'canplaythrough',
          'durationchange',
          'ended',
          'loadeddata',
          'loadedmetadata',
          'loadstart',
          'pause',
          'play',
          'playing',
          'progress',
          'ratechange',
          'seeked',
          'seeking',
          'stalled',
          'suspend',
          'timeupdate',
          'volumechange',
          'waiting',
        ],
      ];

      events.forEach((testCase) => {
        wrapper.setProps({ events: testCase });

        expect(wrapper.vm.onEdEvents).to.deep.equal(propsData.events);
      });
    });
    it('should empty events clear events', () => {
      const privateWrapper = mount(BaseVideoPlayer, {
        propsData: {
          src: 'file:///',
          events: [],
        },
      });

      expect(privateWrapper.vm.onEdEvents).to.deep.equal([]);
    });
    it('should invalid events items be ignored', () => {
      const events = [
        [''],
        ['dataloaded', 'canplaythrough'],
        ['ondataloaded'],
      ];
      const expectedResults = [
        [],
        ['canplaythrough'],
        [],
      ];

      events.forEach((testCase, index) => {
        const newPropsData = Object.assign(
          {},
          propsData,
          { events: testCase },
        );

        const privateWrapper = mount(BaseVideoPlayer, { propsData: newPropsData });

        expect(privateWrapper.vm.onEdEvents).to.deep.equal(expectedResults[index]);
        privateWrapper.destroy();
      });
    });
  });

  describe('Methods', () => {
    let sandbox;
    let wrapper;
    const propsData = {
      src: 'file:///',
      events: ['loadedmetadata'],
    };

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      wrapper = mount(BaseVideoPlayer, { propsData });
    });
    afterEach(() => {
      sandbox.restore();
      wrapper.destroy();
    });

    const { calledOnce } = sinon.assert;

    it('should videoElement return actual videoElement', () => {
      const videoElement = wrapper.vm.videoElement();

      expect(videoElement).to.equal(wrapper.vm.$refs.video);
    });
    it('should invoke the pause function when pause', () => {
      const videoStub = {
        pause: sandbox.spy(),
      };
      wrapper.vm.$refs.video = videoStub;

      wrapper.vm.pause();

      calledOnce(videoStub.pause);
    });
    it('should currentTime update video.currentTime when passed new value', () => {
      const videoStub = {
        currentTime: 0,
      };
      wrapper.vm.$refs.video = videoStub;

      wrapper.vm.currentTime(5);

      expect(wrapper.vm.$refs.video.currentTime).to.equal(5);
    });
    it('should return currentTime when passed no value', () => {
      const videoStub = {
        currentTime: 20,
      };
      wrapper.vm.$refs.video = videoStub;

      const timeResult = wrapper.vm.currentTime();

      expect(timeResult).to.equal(20);
    });
    it('should return duration when invoke duraton', () => {
      const videoStub = {
        duration: 20,
      };
      wrapper.vm.$refs.video = videoStub;

      const durationResult = wrapper.vm.duration();

      expect(durationResult).to.equal(20);
    });
  });
});
