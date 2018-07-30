import BaseVideoPlayer from '@/components/PlayingView/BaseVideoPlayer';
import { mount } from '@vue/test-utils';
import sinon from 'sinon';

describe.only('BaseVideoPlayer Unit Tests', () => {
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
  });
  const { calledOnce } = sinon.assert;

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
