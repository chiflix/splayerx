export const subtitleExtensions = ['ass', 'srt', 'ssa', 'vtt'];
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
export interface IRawSubtitle {
  origin: string;
  format: SubtitleFormat;
  type: SubtitleType;
  language?: LanguageNames;
  ranking?: number;
}
import { LanguageNames } from '@/libs/language/allLanguages';
