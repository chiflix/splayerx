import { Format, Type, VideoSegment, Origin } from './ISubtitle';
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
  videoSegments?: VideoSegment[];
}
interface PrimarySecondary<T> {
  primary: T;
  secondary: T;
}
export interface SubtitlePreference {
  playlistId: number;
  mediaId: string;
  list: StoredSubtitleItem[];
  language: PrimarySecondary<LanguageCode>;
  selected: PrimarySecondary<string>;
}
