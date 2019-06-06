import { openDB } from 'idb';
import infoDB, { InfoDB } from '@/helpers/infoDB';
import dataDB, { DataDb } from '@/helpers/dataDb';
import { IDB, MediaItem, PlaylistItem, SubtitleItem, RawMediaItem, RawPlaylistItem } from '@/interfaces/services/IDB';
import {
  INFO_DATABASE_NAME, DATADB_NAME
} from '@/constants';

export default class DataBase implements IDB {
  db: InfoDB | DataDb;
  currentDB: string;
  getDB(database: string) {
    if (database === INFO_DATABASE_NAME) {
      this.db = infoDB;
      this.currentDB = INFO_DATABASE_NAME;
    } else if (database === DATADB_NAME) {
      this.db = dataDB;
      this.currentDB = DATADB_NAME;
    } else {
      throw new Error(`Wrong Database Name: ${database}`);
    }
  }
  async add(database: string, objectStore: string, data: RawMediaItem | RawPlaylistItem | SubtitleItem): Promise<number> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    }
    return this.db.add(objectStore, data);
  }
  async update(database: string, objectStore: string, key: number, data: PlaylistItem | MediaItem | SubtitleItem): Promise<number> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    }
    if (!key) throw new Error('KeyPath requied!');
    return this.db.update(objectStore, data, key);
  }
  async delete(database: string, objectStore: string, key: number): Promise<undefined> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    }
    return this.db.delete(objectStore, key);
  }
  async clear(database: string, objectStore: string): Promise<undefined> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    } 
    return this.db.clear(objectStore);
  }
  async getAll(database: string, objectStore: string, keyRange?: IDBKeyRange): Promise<PlaylistItem[] | MediaItem[] | SubtitleItem[]> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    }
    if (keyRange) return this.db.getAll(objectStore, keyRange);
    return this.db.getAll(objectStore, undefined);
  }
  async getValueByKey(database: string, objectStore: string, key: number): Promise<PlaylistItem | MediaItem | SubtitleItem | undefined> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    }
    return this.db.get(objectStore, key);
  }
  async getValueByIndex(database: string, objectStore: string, index: string, value: string | number): Promise<PlaylistItem | MediaItem | SubtitleItem | undefined> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    }
    return this.db.get(objectStore, index, value);
  }
  async getAllValueByIndex(database: string, objectStore: string, index: string, value: string | number): Promise<PlaylistItem[] | MediaItem[] | SubtitleItem[]> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    }
    return this.db.getAllValueByIndex(objectStore, index, value);
  }
}

export const database = new DataBase();