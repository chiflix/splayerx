import infoDB, { InfoDB } from '@/helpers/infoDB';
import dataDB, { DataDb } from '@/helpers/dataDb';
import { IDB, MediaItem, PlaylistItem, SubtitleItem, RawMediaItem, RawPlaylistItem } from '@/interfaces/IDB';

export default class DataBase implements IDB {
  constructor(private readonly db: InfoDB | DataDb) {
  }
  async add(objectStore: string, data: RawMediaItem | RawPlaylistItem | SubtitleItem): Promise<number> {
    return this.db.add(objectStore, data);
  }
  async update(objectStore: string, key: number, data: PlaylistItem | MediaItem | SubtitleItem): Promise<number> {
    if (!key) throw new Error('KeyPath requied!');
    return this.db.update(objectStore, data, key);
  }
  async delete(objectStore: string, key: number): Promise<undefined> {
    return this.db.delete(objectStore, key);
  }
  async clear(objectStore: string): Promise<undefined> {
    return this.db.clear(objectStore);
  }
  async getAll(objectStore: string, keyRange?: IDBKeyRange): Promise< any[]> {
    if (keyRange) return this.db.getAll(objectStore, keyRange);
    return this.db.getAll(objectStore, undefined);
  }
  async getValueByKey(objectStore: string, key: number): Promise<any | undefined> {
    return this.db.get(objectStore, key);
  }
  async getValueByIndex(objectStore: string, index: string, value: string | number): Promise<any | undefined> {
    return this.db.get(objectStore, index, value);
  }
  async getAllValueByIndex(objectStore: string, index: string, value: string | number): Promise<any[]> {
    return this.db.getAllValueByIndex(objectStore, index, value);
  }
}

export const info = new DataBase(infoDB);
export const data = new DataBase(dataDB);