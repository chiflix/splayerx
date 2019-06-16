import { TranscriptResponse } from 'sagi-api/translation/v1/translation_pb';

export type SagiSubtitlePayload = TranscriptResponse.Cue.AsObject[];
export interface IRawSubtitle {
  payload: string | SagiSubtitlePayload;
  parse(): Promise<IParsedSubtitle>
}

export interface IInfo {
  PlayResX?: string | undefined;
  PlayResY?: string | undefined;
}
export interface IDialogueTag {
  b?: number;
  i?: number;
  u?: number;
  s?: number;
  alignment?: number;
  pos?: {
    x: number;
    y: number;
  };
  // https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API#Cue_settings
  vertical?: string;
  line?: string;
  position?: string;
  // size: string;
  // align: string';
}
export interface IDialogue {
  start: number;
  end: number;
  text?: string;
  tags?: IDialogueTag;
  fragments?: {
    text: string;
    tags: IDialogueTag;
  }[];
}
export interface IParsedSubtitle {
  info: IInfo;
  dialogues: IDialogue[];
}

export enum SubtitleFormat {
  AdvancedSubStationAplha = 'ass',
  SubRip = 'srt',
  SubStationAlpha = 'ssa',
  WebVTT = 'vtt',
  Sagi = 'sagi',
}

export { AssSubtitle } from './ass';
export { SagiSubtitle } from './sagi';
export { SrtSubtitle } from './srt';
export { VttSubtitle } from './vtt';
