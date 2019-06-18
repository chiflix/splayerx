import { SubtitleFormat, IRawSubtitle } from '../parsers';
import { LanguageCode } from '@/libs/language';

export enum SubtitleType {
  Online,
  Embedded,
  Local,
}

export interface IEmbeddedSubtitleOrigin {
  streamIndex: number;
  videoSrc: string;
}

export { ISubtitleStream } from './embedded';

export interface IOriginSubtitle {
  origin: string | IEmbeddedSubtitleOrigin;
  format: SubtitleFormat;
  type: SubtitleType;
  computeLang(): Promise<LanguageCode>;
  load(): Promise<IRawSubtitle | undefined>
}

export { EmbeddedSubtitle } from './embedded';
export { LocalSubtitle } from './local';
export { OnlineSubtitle } from './online';
