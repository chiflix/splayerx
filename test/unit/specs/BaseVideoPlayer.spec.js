import { mount } from '@vue/test-utils';
import sinon from 'sinon';
import BaseVideoPlayer from '@/components/PlayingView/BaseVideoPlayer.vue';

describe('Component - BaseVideoPlayer', () => {
  const propsData = {
    src: 'file:///',
    crossOrigin: 'anonymous',
    preload: 'auto',
    currentTime: [20],
    defaultPlaybackRate: 2,
    playbackRate: 1.5,
    autoplay: true,
    loop: false,
    controls: false,
    volume: 0.5,
    muted: false,
    defaultMuted: false,
    paused: false,
    events: ['loadedmetadata'],
    styles: {},
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

    function assertVideoAttributes(attribute, rawValue, changedValues, changeOrNot) {
      changedValues.forEach((testCase) => {
        wrapper.setProps({ [attribute]: testCase });

        const changedValue = wrapper.element.childNodes[0][attribute];

        expect(changedValue).to.equal(changeOrNot ? testCase : rawValue);
      });
    }

    describe('Mutable Props', () => {
      it('should currentTime be changed dynamically', () => {
        const currentTimes = [[10], [30], [40], [50]];

        currentTimes.forEach((currentTime) => {
          wrapper.setProps({ currentTime });

          const changedCurrentTime = wrapper.element.childNodes[0].currentTime;

          expect(changedCurrentTime).to.equal(currentTime[0]);
        });
      });

      it('should playbackRate be changed dynamically', () => {
        assertVideoAttributes('playbackRate', propsData.playbackRate, [3, 4, 5, 8], true);
      });

      it('should loop be changed dynamically', () => {
        assertVideoAttributes('loop', propsData.loop, [true], true);
      });

      it('should controls be changed dynamically', () => {
        assertVideoAttributes('controls', propsData.controls, [true], true);
      });

      it('should volume be changed dynamically', () => {
        assertVideoAttributes('volume', propsData.volume, [0.9, 0.3, 0.2, 1], true);
      });

      it('should muted be changed dynamically', () => {
        assertVideoAttributes('muted', propsData.muted, [true], true);
      });

      it('should video be dynamically paused', () => {
        assertVideoAttributes('paused', propsData.paused, [true], true);
      });

      it('should events be dynamically added', () => {
        const finalEvents = ['loadedmetadata', 'canplay'];
        wrapper.setProps({
          events: finalEvents,
        });

        finalEvents.forEach((event) => {
          expect(wrapper.vm.eventListeners.get(event)).to.not.equal(undefined);
        });
      });

      it('should events be dynamically removed', () => {
        wrapper.setProps({ events: [] });

        propsData.events.forEach((event) => {
          expect(wrapper.vm.eventListeners.get(event)).to.equal(undefined);
        });
      });

      it('should styles be dynamically changed', () => {
        const testStyle = {
          objectFit: 'cover',
          width: '100%',
        };

        wrapper.setProps({ styles: testStyle });

        Object.keys(testStyle).forEach((style) => {
          expect(wrapper.element.childNodes[0].style[style]).to.equal(testStyle[style]);
        });
      });
    });

    describe('Immutable Props', () => {
      it('should crossOrigin not be changed dynamically', () => {
        assertVideoAttributes('crossOrigin', propsData.crossOrigin, [!propsData.crossOrigin], false);
      });

      it('should preload not be changed dynamically', () => {
        assertVideoAttributes('preload', propsData.preload, [!propsData.preload], false);
      });

      it('should autoplay not be changed dynamically', () => {
        assertVideoAttributes('autoplay', propsData.autoplay, [!propsData.autoplay], false);
      });

      it('should defaultMuted not be changed dynamically', () => {
        assertVideoAttributes('defaultMuted', propsData.defaultMuted, [!propsData.defaultMuted], false);
      });
    });
  });

  describe('Methods', () => {
    let sandbox;
    let clock;
    let wrapper;
    const propsData = {
      src: 'file:///',
      events: ['loadedmetadata'],
    };

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      clock = sinon.useFakeTimers();
      wrapper = mount(BaseVideoPlayer, { propsData });
    });
    afterEach(() => {
      sandbox.restore();
      clock.restore();
      wrapper.destroy();
    });

    it('should videoElement return actual videoElement', () => {
      const videoElement = wrapper.vm.videoElement();

      expect(videoElement).to.equal(wrapper.vm.$refs.video);
    });

    it('should emitEvents emit events', () => {
      const testEvents = ['loadedmetadata', 'canplay', 'someotherevent'];

      testEvents.forEach((event) => {
        wrapper.vm.emitEvents(event);
      });

      expect(Object.keys(wrapper.emitted())).to.deep.equal(testEvents);
    });

    it('should emitEvents emit events with payloads', () => {
      const testEvents = {
        loadedmetadata: true,
        canplaytype: ['mkv', 'mp3'],
        someotherevent: () => 1 + 1,
      };

      Object.keys(testEvents).forEach((event) => {
        wrapper.vm.emitEvents(event, testEvents[event]);
      });

      Object.keys(wrapper.emitted()).forEach((event) => {
        expect(wrapper.emitted()[event][0][0]).to.equal(testEvents[event]);
      });
    });
  });
});
