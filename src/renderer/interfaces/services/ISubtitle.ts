export type VideoPath = string;
export type SubtitlePath = string;
export type SubtitleHash = string;
export const subtitleExtensions = ['ass', 'srt', 'ssa', 'vtt'];
export enum SubtitleFormat {
  AdvancedSubStationAplha = 'ass',
  SubRip = 'srt',
  SubStationAlpha = 'ssa',
  WebVTT = 'vtt',
}
export enum SubtitleType {
  Online,
  Embedded,
  Local,
  Modified,
}
export interface IRawSubtitle {
  format: SubtitleFormat;
  type: SubtitleType;
  origin: SubtitlePath | VideoPath | SubtitleHash;
}
export interface IParsedSubtitle {}
