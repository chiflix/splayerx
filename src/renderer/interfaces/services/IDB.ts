import { clear } from "winston";

export type RawPlaylistItem = {
  items: IDBValidKey[],
  hpaths: string[],
  lastOpened: number,
  playedIndex: number,
}
export type RawMediaItem = {
  quickHash: string,
  path: string,
  lastPlayedTime: number,
  duration: number,
  source: string,
}
export type PlaylistItem = {
  id: number,
  items: IDBValidKey[],
  hpaths: string[],
  lastOpened: number,
  playedIndex: number,
}
export type MediaItem = {
  videoId: number,
  quickHash: string,
  path: string,
  lastPlayedTime: number,
  duration: number,
  source: string,
}
export type SubtitleItem = {
  format: string,
  language: string,
  src: string,
  type: string,
}
export interface IDB {
  add(database: string, schema: string, data: RawMediaItem | RawPlaylistItem): Promise<number>
  update(database: string, schema: string, key: number, data: PlaylistItem | MediaItem): Promise<number>
  delete(database:string, schema: string, key: number): Promise<undefined>
  clear(database: string, schema: string): Promise<undefined>
  getAll(database: string, schema: string, keyRange: IDBKeyRange): Promise<PlaylistItem[] | MediaItem[] | SubtitleItem[]>
  getValueByKey(database: string, schema: string, key: number): Promise<PlaylistItem | MediaItem | SubtitleItem | undefined>
  getValueByIndex(database: string, schema: string, index: string, value: string | number): Promise<PlaylistItem | MediaItem | SubtitleItem | undefined>
  getAllValueByIndex(database: string, schema: string, index: string, value: string | number): Promise<PlaylistItem[] | MediaItem[] | SubtitleItem[]>
}