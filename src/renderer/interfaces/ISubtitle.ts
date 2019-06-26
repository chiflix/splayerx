import { LanguageCode } from '@/libs/language';

export enum Type {
  Online = 'online',
  Embedded = 'embedded',
  Local ='local',
}
export enum Format {
  AdvancedSubStationAplha = 'ass',
  Sagi = 'sagi',
  SubRip = 'srt',
  SubStationAlpha = 'ssa',
  WebVTT = 'webvtt',
  Unknown = 'unknown',
}

export interface Origin {
  type: Type;
  source: any;
}
export type Entity = {
  source: Origin;
  type: Type;
  format: Format;
  language: LanguageCode;
  payload: any;
  hash: string;
}
export type SubtitleControlListItem = {
  id: string;
  type: Type;
  language: LanguageCode;
};

export interface EntityGenerator {
  getSource(): Promise<Origin>
  getType(): Promise<Type>
  getFormat(): Promise<Format>
  getLanguage(): Promise<LanguageCode>
  getPayload(): Promise<any>
  getHash(): Promise<string>
}

export interface Info {
  PlayResX?: string | undefined;
  PlayResY?: string | undefined;
}
export interface Tags {
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
export type Cue = {
  category?: string,
  start: number,
  end: number,
  text: string,
  hide?: boolean,
  format: string,
  tags: Tags,
}
export interface Dialogue {
  start: number;
  end: number;
  text?: string;
  tags?: Tags;
  fragments?: {
    text: string;
    tags: Tags;
  }[];
}
export interface VideoSegment {
  start: number;
  end: number;
  played: boolean;
}

export interface Parser {
  parse(subtitle: Entity): void;
  readonly payload: any;
  getInfo(): Promise<Info>;
  getDialogues(time?: number): Promise<Dialogue[]>;
  getVideoSegments(duration: number): Promise<VideoSegment[]>;
}
