import {
  Format, Type, IVideoSegment, IOrigin,
} from './ISubtitle';
import { LanguageCode } from '@/libs/language';

export interface IStoredSubtitle {
  hash: string;
  source: IOrigin[];
  format: Format;
  language: LanguageCode;
}
export interface IStoredSubtitleItem {
  /** must be real hash to retrieve real subtitle from db */
  hash: string;
  /** may be fake type for display use only */
  type: Type;
  /** may also be fake source for display use only */
  source: unknown;
  videoSegments?: IVideoSegment[];
  delay: number;
}
interface IPrimarySecondary<T> {
  primary?: T;
  secondary?: T;
}
export type SelectedSubtitle = { hash: string, source?: IOrigin };
export interface ISubtitlePreference {
  playlistId: number;
  mediaId: string;
  list: IStoredSubtitleItem[];
  language: IPrimarySecondary<LanguageCode>;
  selected: IPrimarySecondary<SelectedSubtitle>;
}
