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
  'resize',
  'ratechange',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  'timeupdate',
  'volumechange',
  'waiting',
  'audiotrack',
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
export const INFO_DATABASE_NAME = 'Info';
export const VIDEO_OBJECT_STORE_NAME = 'media-item';
export const RECENT_OBJECT_STORE_NAME = 'recent-played';
export const INFODB_VERSION = 3;
/**
 * Remember to increment the INFODB_VERSION after updating the following INFO_SCHEMA
 */
export const INFO_SCHEMAS = [
  {
    name: RECENT_OBJECT_STORE_NAME,
    options: {
      keyPath: 'id',
      autoIncrement: true,
    },
    indexes: ['lastOpened', 'hpaths'],
  },
  {
    name: VIDEO_OBJECT_STORE_NAME,
    options: {
      keyPath: 'videoId',
      autoIncrement: true,
    },
    indexes: ['path', 'lastPlayedTime', 'source'],
  },
];

export const DATADB_NAME = 'data';
export const SUBTITLE_OBJECTSTORE_NAME = 'subtitles';
export const DATADB_VERSION = 1;
export const DATADB_SHCEMAS = [
  {
    version: 1,
    schema: [
      {
        name: SUBTITLE_OBJECTSTORE_NAME,
        options: {
          autoIncrement: true,
        },
        indexes: [
          {
            name: 'type',
            unique: false,
          },
          {
            name: 'src',
            unique: false,
          },
          {
            name: 'format',
            unique: false,
          },
          {
            name: 'language',
            unique: false,
          },
          {
            name: 'lastOpened',
            unique: false,
          },
        ],
        properties: [
          'type',
          'src',
          'format',
          'language',
          'data',
          'lastOpened',
        ],
      },
    ],
  },
];

/** electron 缓存用户数据路径
 * @constant
 * @type {String}
 */
export const ELECTRON_CACHE_DIRNAME = 'userData'; // 用户数据路径

/** 设定的应用缓存目录
 * @constant
 * @type {String}
 */
export const DEFAULT_DIRNAME = '__cache_files__'; // 设定的应用缓存目录

/** 日志存储目录
 * @constant
 */
export const DEFAULT_LOG_DIRNAME = 'logs';

/** 视频缓存目录
 * @constant
 * @type {String}
 */
export const VIDEO_DIRNAME = 'videos'; // 视频缓存目录
export const SUBTITLE_DIRNAME = 'subtitles'; // 视频缓存目录
