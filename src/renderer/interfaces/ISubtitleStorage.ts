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
  source: any;
  videoSegments?: VideoSegment[];
  delay: number;
}
interface PrimarySecondary<T> {
  primary?: T;
  secondary?: T;
}
export type SelectedSubtitle = { hash: string, source?: Origin };
export interface SubtitlePreference {
  playlistId: number;
  mediaId: string;
  list: StoredSubtitleItem[];
  language: PrimarySecondary<LanguageCode>;
  selected: PrimarySecondary<SelectedSubtitle>;
}
