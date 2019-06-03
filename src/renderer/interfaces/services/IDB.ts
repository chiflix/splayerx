export type RawPlaylistItem = {
  items: IDBValidKey[],
  lastOpened: number,
  playedIndex: number,
}
export type RawMediaItem = {
  quickHash: string,
  lastPlayedTime: number,
  duration: number,
}
export type PlaylistItem = {
  id: string,
  items: IDBValidKey[],
  lastOpened: number,
  playedIndex: number,
}
export type MediaItem = {
  videoId: number,
  quickHash: string,
  lastPlayedTime: number,
  duration: number,
}
export type SubtitleItem = {
  format: string,
  language: string,
  src: string,
  type: string,
}
export interface IDB {
  add(database: string, schema: string, data: RawMediaItem | RawPlaylistItem): Promise<number>
  update(database: string, schema: string, key: number, data: PlaylistItem | MediaItem): Promise<null>
  delete(database:string, schema: string, key: number): Promise<null>
  getAll(database: string, schema: string, keyRange: IDBKeyRange): Promise<PlaylistItem[] | MediaItem[] | SubtitleItem[]>
  getValueByKey(database: string, schema: string, key: number): Promise<PlaylistItem | MediaItem | SubtitleItem | undefined>
  getValueByIndex(database: string, schema: string, index: string, value: string | number): Promise<PlaylistItem | MediaItem | SubtitleItem | undefined>
  getAllValueByIndex(database: string, schema: string, index: string, value: string | number): Promise<PlaylistItem[] | MediaItem[] | SubtitleItem[]>
}