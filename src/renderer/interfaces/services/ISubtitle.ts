export const subtitleExtensions = ['ass', 'srt', 'ssa', 'vtt'];
export enum SubtitleCodec {
  AdvancedSubStationAplha = 'ASS (Advanced SSA) subtitle',
  SubRip = 'SubRip subtitle',
  WebVTT = 'WebVTT subtitle',
};
export const subtitleCodecs = [
  'ASS (Advanced SSA) subtitle', 'ass',
  'SubRip subtitle', 'srt',
  'WebVTT subtitle', 'vtt',
];
export enum SubtitleFormat {
  AdvancedSubStationAplha = 'ass',
  SubRip = 'srt',
  SubStationAlpha = 'ssa',
  WebVTT = 'vtt',
  Online = 'online',
}
export enum SubtitleType {
  Online,
  Embedded,
  Local,
  Modified,
}
export interface ISubtitleStream {
  codec_type: string;
  codec_name: string;
  index: number;
  tags: {
    language: LanguageNames;
    title: string;
  };
  disposition: {
    default: 0 | 1;
  };
}
interface IEmbeddedSubtitleOrigin {
  streamIndex: number;
  videoSrc: string;
}
export interface IRawSubtitle {
  origin: string | IEmbeddedSubtitleOrigin;
  format: SubtitleFormat;
  type: SubtitleType;
  language?: LanguageNames;
}

export declare class RawLocalSubtitle implements IRawSubtitle {
  origin: string;
  format: SubtitleFormat;
  type: SubtitleType.Local;
  language?: LanguageNames;
  name: string;
}
export declare class RawOnlineSubtitle implements IRawSubtitle {
  origin: string;
  format: SubtitleFormat.Online;
  type: SubtitleType.Online;
  language: LanguageNames;
  ranking: number;
}
export declare class RawEmbeddedSubtitle implements IRawSubtitle {
  origin: {
    streamIndex: number;
    videoSrc: string;
  };
  format: SubtitleFormat;
  type: SubtitleType.Embedded;
  language?: LanguageNames;
  codec: string;
  isDefault: boolean;
  name?: string;
}
import { LanguageNames } from '@/libs/language/allLanguages';
