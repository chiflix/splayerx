import { DBSchema } from 'idb';
import { IOriginSubtitle } from '../subtitle/loaders';
import { LanguageCode } from '@/libs/language';
import { RECENT_OBJECT_STORE_NAME, VIDEO_OBJECT_STORE_NAME } from '@/constants';
import { MediaItem, PlaylistItem } from '@/interfaces/IDB';

interface DataDBV1 extends DBSchema {
  'subtitles': {
    key: number;
    value: {
      type: string;
      src: number | string;
      format: string;
      language: string;
    };
    indexes: {
      type: string;
      format: string;
      src: number | string;
      language: string;
      lastOpened: Date;
    };
  }
}
interface DataDBV2 extends DBSchema {
  'subtitles': {
    key: string;
    value: IOriginSubtitle;
  };
  'preferences': {
    key: string;
    value: {
      language: [LanguageCode, LanguageCode];
      list: IOriginSubtitle;
      selected: string[];
    };
  };
}
interface InfoDBV3 extends DBSchema {
  [RECENT_OBJECT_STORE_NAME]: {
    key: string;
    value: PlaylistItem;
    indexes: {
      lastOpened: number;
      hpaths: string[];
    };
  };
  [VIDEO_OBJECT_STORE_NAME]: {
    key: string;
    value: MediaItem;
    indexes: {
      path: string;
      lastPlayedTime: number;
      source: string;
    };
  };
}
