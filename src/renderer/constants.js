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
export const THUMBNAIL_DB_NAME = 'splayerx-preview-thumbnails';
export const INFO_DATABASE_NAME = 'Info';
export const THUMBNAIL_OBJECT_STORE_NAME = 'the-preview-thumbnail';
export const INFODB_VERSION = 1;
/**
 * Remember to increment the INFODB_VERSION after updating the following INFO_SCHEMA
 */
export const INFO_SCHEMA = [
  {
    name: 'recent-played',
    indexes: ['lastOpened', 'path', 'lastPlayedTime'],
  },
  {
    name: THUMBNAIL_OBJECT_STORE_NAME,
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

// $bus.$emit name constants collections
export const EVENT_BUS_COLLECTIONS = {
  // subtitle manager
  EXPORT_MODIFIED_SUBTITLE: 'EXPORT_MODIFIED_SUBTITLE', // 导出自制字幕到本地
  // subtitle editor short key
  SUBTITLE_EDITOR_UNDO: 'SUBTITLE_EDITOR_UNDO', // 撤销
  SUBTITLE_EDITOR_REDO: 'SUBTITLE_EDITOR_REDO', // 重复
  SUBTITLE_EDITOR_SAVE: 'SUBTITLE_EDITOR_SAVE', // 保存
  SUBTITLE_EDITOR_EXIT: 'SUBTITLE_EDITOR_EXIT', // 退出高级模式
  SUBTITLE_EDITOR_LOAD_LOCAL: 'SUBTITLE_EDITOR_LOAD_LOCAL', //
  SUBTITLE_EDITOR_SWITCH_REFERENCE_SUBTITLE: 'SUBTITLE_EDITOR_SWITCH_REFERENCE_SUBTITLE', // 切换参考字幕
  CREATE_MIRROR_SUBTITLE: 'CREATE_MIRROR_SUBTITLE', // 高级模式，新增字幕，需要使用假的字幕dom来实现动效
  WILL_MODIFIED_SUBTITLE: 'WILL_MODIFIED_SUBTITLE', // 字幕高级模式将要修改字幕，用来存储历史记录
  DID_MODIFIED_SUBTITLE: 'DID_MODIFIED_SUBTITLE', // 字幕真正发生修改
  SUBTITLE_EDITOR_SELECT_PREV_SUBTITLE: 'SUBTITLE_EDITOR_SELECT_PREV_SUBTITLE', // 字幕高级模式H选择上一个字幕
  SUBTITLE_EDITOR_SELECT_NEXT_SUBTITLE: 'SUBTITLE_EDITOR_SELECT_NEXT_SUBTITLE', // 字幕高级模式L选择下一个字幕
  SUBTITLE_EDITOR_FOCUS_BY_ENTER: 'SUBTITLE_EDITOR_FOCUS_BY_ENTER', // 字幕高级模式下，按回车键，触发当前输入框focus
  SUBTITLE_DELETE_CONFIRM: 'SUBTITLE_DELETE_CONFIRM', // 确认删除自制字幕
  SUBTITLE_DELETE_CANCEL: 'SUBTITLE_DELETE_CANCEL', // 确认删除自制字幕
  SUBTITLE_DELETE_DONE: 'SUBTITLE_DELETE_DONE', // 确认删除自制字幕
  SUBTITLE_DELETE_IMMEDIATELY: 'SUBTITLE_DELETE_IMMEDIATELY', // 删除自制字幕
  SUBTITLE_DELETE: 'SUBTITLE_DELETE', // 删除自制字幕
};

// 字幕高级模式下，将要修改字幕操作类型
export const MODIFIED_SUBTITLE_TYPE = Object.freeze({
  ADD: Symbol('add new subtitle'),
  DELETE: Symbol('delete one subtitle'),
  REPLACE: Symbol('replace one subtitle'),
  ADD_FROM_REFERENCE: Symbol('add new subtitle from reference subtitle'),
  DELETE_FROM_REFERENCE: Symbol('delete one subtitle from reference subtitle'),
});
