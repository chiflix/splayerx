import { Format, Type, VideoSegments, Origin } from './ISubtitle';
import { LanguageCode } from '@/libs/language';

export interface StoredSubtitle {
  hash: string;
  source: Origin[];
  format: Format;
  language: LanguageCode;
}
export interface StoredSubtitleItem {
  hash: string;
  type: Type;
  videoSegments: VideoSegments;
}
