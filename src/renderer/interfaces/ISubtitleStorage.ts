import {
  Format, Type, VideoSegment, Origin,
} from './ISubtitle';
import { LanguageCode } from '@/libs/language';

export interface StoredSubtitle {
  hash: string;
  source: Origin[];
  format: Format;
  language: LanguageCode;
}
export interface StoredSubtitleItem {
  /** must be real hash to retrieve real subtitle from db */
  hash: string;
  /** may be fake type for display use only */
  type: Type;
  /** may also be fake source for display use only */
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
