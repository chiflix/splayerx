import { SubtitleFormat, IRawSubtitle } from '../parsers';
import { LanguageCode } from '@/libs/language';
import { OnlineSubtitle } from './online';
import { EmbeddedSubtitle } from './embedded';

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
  computeName(subtitleList?: (OnlineSubtitle | EmbeddedSubtitle)[], locale?: LanguageCode): Promise<string>;
  load(): Promise<IRawSubtitle | undefined>
}

export { EmbeddedSubtitle } from './embedded';
export { LocalSubtitle } from './local';
export { OnlineSubtitle } from './online';
