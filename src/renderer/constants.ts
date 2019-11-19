import electron from 'electron';
import { join } from 'path';

const app = electron.app || electron.remote.app;

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
export const BROWSINGDB_NAME = 'browsingDB';
export const HISTORY_OBJECT_STORE_NAME = 'history';
export const BROWSINGDB_VERSION = 1;

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
export const TOKEN_FILE_NAME = 'session.txt'; // 视频缓存目录
export const SUBTITLE_FULL_DIRNAME = join(
  app.getPath(ELECTRON_CACHE_DIRNAME),
  DEFAULT_DIRNAME,
  SUBTITLE_DIRNAME,
);

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
  SUBTITLE_EDITOR_AUTO_FOCUS: 'SUBTITLE_EDITOR_AUTO_FOCUS', // 输入框focus
  SUBTITLE_DELETE_CONFIRM: 'SUBTITLE_DELETE_CONFIRM', // 确认删除自制字幕
  SUBTITLE_DELETE_CANCEL: 'SUBTITLE_DELETE_CANCEL', // 确认删除自制字幕
  SUBTITLE_DELETE_DONE: 'SUBTITLE_DELETE_DONE', // 确认删除自制字幕
  SUBTITLE_DELETE_IMMEDIATELY: 'SUBTITLE_DELETE_IMMEDIATELY', // 删除自制字幕
  SUBTITLE_DELETE: 'SUBTITLE_DELETE', // 删除自制字幕
};

// 字幕高级模式下，将要修改字幕操作类型
export enum MODIFIED_SUBTITLE_TYPE {
  ADD = 'add new subtitle',
  DELETE = 'delete one subtitle',
  REPLACE = 'replace one subtitle',
  ADD_FROM_REFERENCE = 'add new subtitle from reference subtitle',
  DELETE_FROM_REFERENCE = 'delete one subtitle from reference subtitle',
}
