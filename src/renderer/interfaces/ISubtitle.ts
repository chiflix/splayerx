import { LanguageCode } from '@/libs/language';

type Partial<T> = { [P in keyof T]?: T[P] };

export enum Type {
  Online = 'online',
  Embedded = 'embedded',
  Local = 'local',
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
  delay: number;
}
export type SubtitleControlListItem = {
  id: string;
  hash: string;
  type: Type;
  language: LanguageCode;
  source: any;
  name?: string;
  delay: number;
};

export interface EntityGenerator {
  /** get real source to fetch subtitle from */
  getSource(): Promise<Origin>
  /** get fake source for display use */
  getStoredSource?: any
  getDelay?: () => Promise<number>
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
export type TagsPartial = Partial<Tags>;

export type Cue = {
  category?: string,
  start: number,
  end: number,
  text: string,
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
  parse(): void;
  readonly payload: any;
  getInfo(): Promise<Info>;
  getDialogues(time?: number): Promise<Cue[]>;
  getVideoSegments(duration: number): Promise<VideoSegment[]>;
  updateVideoSegments(lastTime: number, currentTime: number): number;
}

export type Subtitle = {
  id: string
  name: string,
  language: string,
  format?: string,
  rank: number,
  loading: string,
  type: string,
}
