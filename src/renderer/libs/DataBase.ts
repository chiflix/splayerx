import infoDB, { InfoDB } from '@/helpers/infoDB';
import dataDB, { DataDb } from '@/helpers/dataDb';
import {
  IDB, MediaItem, PlaylistItem, SubtitleDataItem, RawMediaItem, RawPlaylistItem,
} from '@/interfaces/IDB';

export default class DataBase implements IDB {
  private db: InfoDB | DataDb;

  public constructor(db: InfoDB | DataDb) {
    this.db = db;
  }

  public async add(
    objectStore: string,
    data: RawMediaItem | RawPlaylistItem | SubtitleDataItem,
  ): Promise<number> {
    return this.db.add(objectStore, data);
  }

  public async update(
    objectStore: string,
    key: number,
    data: PlaylistItem | MediaItem | SubtitleDataItem,
  ): Promise<number> {
    if (!key) throw new Error('KeyPath requied!');
    return this.db.update(objectStore, data, key);
  }

  public async delete(objectStore: string, key: number): Promise<undefined> {
    return this.db.delete(objectStore, key);
  }

  public async clear(objectStore: string): Promise<undefined> {
    return this.db.clear(objectStore);
  }

  public async getAll(objectStore: string, keyRange?: IDBKeyRange) {
    if (keyRange) return this.db.getAll(objectStore, keyRange);
    return this.db.getAll(objectStore, undefined);
  }

  public async getValueByKey(objectStore: string, key: number) {
    return this.db.get(objectStore, key);
  }

  public async getValueByIndex(
    objectStore: string,
    index: string,
    value: string | number,
  ) {
    return this.db.get(objectStore, index, value);
  }

  public async getAllValueByIndex(
    objectStore: string,
    index: string,
    value: string | number,
  ) {
    return this.db.getAllValueByIndex(objectStore, index, value);
  }
}

export const info = new DataBase(infoDB);
export const data = new DataBase(dataDB);
