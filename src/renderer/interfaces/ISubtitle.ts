import { LanguageCode } from '../libs/language';

type Partial<T> = { [P in keyof T]?: T[P] };

export enum Type {
  Online = 'online',
  Embedded = 'embedded',
  Local = 'local',
  Translated = 'translated',
}
export enum Format {
  AdvancedSubStationAplha = 'ass',
  Sagi = 'sagi',
  SubRip = 'subrip',
  SubStationAlpha = 'ssa',
  WebVTT = 'webvtt',
  Unknown = 'unknown',
}

export interface IOrigin {
  type: Type;
  source: unknown;
}
export type Entity = {
  source: IOrigin;
  type: Type;
  format: Format;
  language: LanguageCode;
  payload: unknown;
  hash: string;
  metadata: IMetadata;
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

export interface IEntityGenerator {
  /** get real source to fetch subtitle from */
  getSource(): Promise<IOrigin>
  /** get fake source for display use */
  getStoredSource?: () => Promise<IOrigin>
  getDelay?: () => Promise<number>
  getType(): Promise<Type>
  getFormat(): Promise<Format>
  getLanguage(): Promise<LanguageCode>
  getPayload(): Promise<unknown>
  getHash(): Promise<string>
}

export interface IMetadata {
  PlayResX?: string;
  PlayResY?: string;
}

export interface ITags {
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
export type TagsPartial = Partial<ITags>;

export type Cue = {
  category?: string,
  start: number,
  end: number,
  text: string,
  format: string,
  tags: ITags,
}
export interface IDialogue {
  start: number;
  end: number;
  text?: string;
  tags?: ITags;
  fragments?: {
    text: string;
    tags: ITags;
  }[];
}
export interface IVideoSegment {
  start: number;
  end: number;
  played: boolean;
}

export interface IParser {
  parse(): void;
  readonly payload: unknown;
  getMetadata(): Promise<IMetadata>;
  getDialogues(time?: number): Promise<Cue[]>;
  getVideoSegments(duration: number): Promise<IVideoSegment[]>;
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

export const NOT_APPORIRATE_SUBTITLE = 'NOT_APPORIRATE_SUBTITLE';
