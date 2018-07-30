import BaseVideoPlayer from '@/components/PlayingView/BaseVideoPlayer';
import { mount } from '@vue/test-utils';
import sinon from 'sinon';

describe('BaseVideoPlayer Props Unit Tests', () => {
  let wrapper;
  const propsData = {
    src: 'file:///',
    defaultEvents: ['loadedmetadata'],
  };
  beforeEach(() => {
    wrapper = mount(BaseVideoPlayer, { propsData });
  });

  it('should have default proper playbackRate', () => {
    expect(wrapper.vm.playbackRate).to.equal(1);
  });
  it('should playbackRate validator function normally', () => {
    const { validator } = wrapper.vm.$options.props.playbackRate;
    const playbackRates = [5, 20, 205, -3];
    const expectedResults = [true, true, false, false];

    playbackRates.forEach((testCase, index) => {
      expect(validator && validator(testCase)).to.equal(expectedResults[index]);
    });
  });

  it('should src props required', () => {
    expect(wrapper.vm.$options.props.src.required).to.equal(true);
  });
  it('should src validator function normally', () => {
    const { validator } = wrapper.vm.$options.props.src;
    const srcs = [
      '',
      'file:///Users/treve/Documents/Projects/splayerx/test/assets/mediaQuickHash_test.avi',
      'file://Z:/Documents/testVideoFiles/mediaQuickHash_test.avi',
      'http://youtube.com/s/sjdfhsjkdfhsk/',
      'thunder://what.avi',
    ];
    const expectedResults = [false, true, true, true, false];

    srcs.forEach((testCase, index) => {
      expect(validator && validator(testCase)).to.equal(expectedResults[index]);
    });
  });

  it('should volume have default value', () => {
    expect(wrapper.props().volume).to.equal(0.7);
  });
  it('should volume validator function normally', () => {
    const { validator } = wrapper.vm.$options.props.volume;
    const volumes = [0.8, 0.9, '0.7', -0.5, 12];
    const expectedResults = [true, true, false, false, false];

    volumes.forEach((testCase, index) => {
      expect(validator && validator(testCase)).to.equal(expectedResults[index]);
    });
  });

  it('should defaultEvents be required', () => {
    expect(wrapper.vm.$options.props.defaultEvents.required).to.equal(true);
  });
  it('should defaultEvents validator function normally', () => {
    const { validator } = wrapper.vm.$options.props.defaultEvents;
    const events = [
      'loadedmetadata',
      [],
      [''],
      ['loadedmetadata', 'canplay'],
      ['dataloaded', 'canplaythrough'],
      ['ondataloaded'],
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
    const expectedResults = [false, true, false, true, false, false, true];

    events.forEach((testCase, index) => {
      expect(validator && validator(testCase)).to.equal(expectedResults[index]);
    });
  });

  it('should defaultOptions have proper value', () => {
    expect(wrapper.props().defaultOptions).to.deep.equal({
      autoplay: true,
      crossOrigin: false,
      defaultMuted: false,
      defaultPlaybackRate: 1,
      loop: false,
      muted: false,
      preload: 'auto',
    });
  });

  it('should customOptions have proper default value', () => {
    expect(wrapper.props().customOptions).to.deep.equal({
      pauseOnStart: false,
      commitToVuex: false,
    });
  });
});

describe('BaseVideoPlayer functions unit tests', () => {
  let sandbox;
  let wrapper;
  const propsData = {
    src: 'file:///',
    defaultEvents: ['loadedmetadata'],
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

  it('should call initialization functions upon mounted', () => {
    const basicInfoInitializationSpy = sandbox.spy(wrapper.vm, 'basicInfoInitialization');
    const defaultEventsInitializationSpy = sandbox.spy(wrapper.vm, 'defaultEventsInitialization');
    const defaultOptionsInitializationSpy = sandbox.spy(wrapper.vm, 'defaultOptionsInitialization');
    const customOptionsInitializationSpy = sandbox.spy(wrapper.vm, 'customOptionsInitialization');

    wrapper.vm.initializeVideoPlayer();

    calledOnce(basicInfoInitializationSpy);
    calledOnce(defaultEventsInitializationSpy);
    calledOnce(defaultOptionsInitializationSpy);
    calledOnce(customOptionsInitializationSpy);
  });
  it('should set proper attributes to video element', () => {
    const videoStub = {
      setAttribute(attrName, attrValue) {
        this.attributes[attrName] = attrValue;
      },
      getAttribute(attrName) {
        return this.attributes[attrName];
      },
      attributes: {},
    };

    wrapper.vm.basicInfoInitialization(videoStub);

    expect(videoStub.getAttribute('playbackRate')).to.equal(wrapper.vm.playbackRate);
    expect(videoStub.getAttribute('src')).to.equal(wrapper.vm.src);
    expect(videoStub.getAttribute('volume')).to.equal(wrapper.vm.volume);
  });
  it('should events initialization return proper value', () => {
    wrapper.vm.emitPlayerState = sandbox.stub();
    const eventsTest = ['loadedmetadata', 'canplay'];

    const results = wrapper.vm.defaultEventsInitialization(eventsTest);

    expect(eventsTest).to.deep.equal(results);
  });
  it('should emit proper events without value', () => {
    const emitSpy = sandbox.spy(wrapper.vm, '$emit');

    wrapper.vm.emitPlayerState('test');

    sinon.assert.calledWith(emitSpy, 'test');
  });
  it('should emit proper events with value', () => {
    const emitSpy = sandbox.spy(wrapper.vm, '$emit');

    wrapper.vm.emitPlayerState('test', 'second');

    sinon.assert.calledWith(emitSpy, 'test', { test: 'second' });
  });
  it('should set proper attributes according to optionsObject', () => {
    const videoStub = {
      setAttribute(attrName, attrValue) {
        this.attributes[attrName] = attrValue;
      },
      getAttribute(attrName) {
        return this.attributes[attrName];
      },
      attributes: {},
    };
    const optionsObject = {
      loop: false,
      autoplay: true,
      muted: true,
    };

    wrapper.vm.defaultOptionsInitialization(optionsObject, videoStub);

    Object.keys(optionsObject).forEach((optionName) => {
      expect(videoStub.getAttribute(optionName)).to.equal(optionsObject[optionName]);
    });
  });
  it('should addEventListener when pauseOnStart', () => {
    const videoStub = {
      addEventListener: sandbox.spy(),
    };

    wrapper.vm.customOptionsInitialization({ pauseOnStart: true }, videoStub);

    sinon.assert.calledWith(videoStub.addEventListener, 'loadedmetadata', wrapper.vm.pause);
  });

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
