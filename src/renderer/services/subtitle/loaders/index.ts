import { SubtitleFormat, IRawSubtitle } from '../parsers';
import { LanguageNames } from '@/libs/language/allLanguages';

export enum SubtitleType {
  Online,
  Embedded,
  Local,
  Modified,
}

export interface IEmbeddedSubtitleOrigin {
  streamIndex: number;
  videoSrc: string;
}

export interface IOriginSubtitle {
  origin: string | IEmbeddedSubtitleOrigin;
  format: SubtitleFormat;
  type: SubtitleType;
  language?: LanguageNames;
  payload: IRawSubtitle;
}