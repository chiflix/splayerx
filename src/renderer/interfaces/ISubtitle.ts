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
  source: unknown;
}
export type Entity = {
  source: Origin;
  type: Type;
  format: Format;
  language: LanguageCode;
  payload: unknown;
  hash: string;
  metadata: Metadata;
  delay: number;
}
export const defaultEntity: Entity = {
  source: {
    type: Type.Local,
    source: '',
  },
  type: Type.Local,
  format: Format.Unknown,
  language: LanguageCode.Default,
  payload: '',
  hash: '',
  metadata: {},
  delay: 0,
};
export type SubtitleControlListItem = {
  id: string;
  hash: string;
  type: Type;
  language: LanguageCode;
  source: unknown;
  name?: string;
  delay: number;
};

export interface EntityGenerator {
  /** get real source to fetch subtitle from */
  getSource(): Promise<Origin>
  /** get fake source for display use */
  getStoredSource?: () => Promise<Origin>
  getDelay?: () => Promise<number>
  getType(): Promise<Type>
  getFormat(): Promise<Format>
  getLanguage(): Promise<LanguageCode>
  getPayload(): Promise<unknown>
  getHash(): Promise<string>
}

export interface Metadata {
  PlayResX?: string;
  PlayResY?: string;
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
  readonly payload: unknown;
  getMetadata(): Promise<Metadata>;
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
