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
export interface IEntity {
  displaySource: IOrigin;
  realSource: IOrigin;
  hash: string;
  format: Format;
  language: LanguageCode;
  delay: number;
}
export interface IEntityGenerator {
  getDisplaySource(): Promise<IOrigin>;
  getRealSource(): Promise<IOrigin>;
  getHash(): Promise<string>
  getFormat(): Promise<Format>
  getLanguage(): Promise<LanguageCode>
  getDelay(): Promise<number>
  getVideoSegments?: () => Promise<IRawVideoSegment[]>
  getAutoUploaded?: () => Promise<boolean>
}
export interface ISubtitleControlListItem {
  id: string;
  hash: string;
  type: Type;
  language: LanguageCode;
  source: IOrigin;
  name?: string;
}
export interface ILoader {
  readonly source: IOrigin;
  readonly canPreload: boolean;
  readonly canCache: boolean;
  readonly canUpload: boolean;
  readonly fullyRead: boolean;
  getPayload(time?: number): Promise<unknown>;
  pause(): void | Promise<void>;
  cache(): Promise<IOrigin>;
  on(event: 'cache' | 'read' | 'upload', callback: (result: boolean) => void): void;
  once(event: 'cache' | 'read' | 'upload', callback: (result: boolean) => void): void;
}
export interface IParser {
  readonly format: Format;
  readonly loader: ILoader;
  readonly videoSegments: IVideoSegments;
  getMetadata(): Promise<IMetadata>;
  getDialogues(time?: number): Promise<Cue[]>;
}
export interface ITimeSegments {
  insert(start: number, end: number): void;
  check(time: number): boolean;
}
export interface IVideoSegments extends ITimeSegments {
  updatePlayed(timeStamp: number, lastTimeStamp?: number): void;
  playedTime: number;
  export(): IRawVideoSegment[];
  restore(videoSegments: IRawVideoSegment[]): void;
}
export interface IRawVideoSegment {
  start: number;
  end: number;
  played: boolean;
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

export type Subtitle = {
  id: string
  name: string,
  language: string,
  format?: string,
  rank: number,
  loading: string,
  type: string,
}

export const NOT_SELECTED_SUBTITLE = 'NOT_SELECTED_SUBTITLE';
