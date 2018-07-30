export const PLAYBACKSTATE = Object.freeze({
  PLAYING: Symbol('playing'),
  PAUSED: Symbol('paused'),
  UNKNOWN: Symbol('unknown'),
});

export const bar = 'bar';

export const WIDTH_OF_SCREENSHOT = 170;
export const HALF_WIDTH_OF_SCREENSHOT = 85;
export const SCREENSHOT_SIDE_MARGIN_WIDTH = 16;

export const PROGRESS_BAR_HEIGHT = '10px';
export const PROGRESS_BAR_SLIDER_HIDE_HEIGHT = '4px';
export const PROGRESS_BAR_HIDE_HEIGHT = '0px';

export const FOOL_PROOFING_BAR_WIDTH = 20;

export const DEFAULT_VIDEO_EVENTS = [
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
];
export const DEFAULT_VIDEO_OPTIONS = [
  'autoplay',
  'controls',
  'crossOrigin',
  'currentTime',
  'defaultMuted',
  'defaultPlaybackRate',
  'loop',
  'mediaGroup',
  'muted',
  'playbackRate',
  'preload',
  'src',
  'volume',
];
