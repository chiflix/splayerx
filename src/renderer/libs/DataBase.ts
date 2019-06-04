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
  async add(database: string, schema: string, data: RawMediaItem | RawPlaylistItem | SubtitleItem): Promise<number> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    }
    return this.db.add(schema, data);
  }
  async update(database: string, schema: string, key: number, data: PlaylistItem | MediaItem | SubtitleItem): Promise<null> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    }
    return this.db.update(schema, data, key);
  }
  async delete(database: string, schema: string, key: number): Promise<null> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    }
    return this.db.delete(schema, key);
  }
  async getAll(database: string, schema: string, keyRange?: IDBKeyRange): Promise<PlaylistItem[] | MediaItem[] | SubtitleItem[]> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    }
    if (keyRange) return this.db.getAll(schema, keyRange);
    return this.db.getAll(schema, undefined);
  }
  async getValueByKey(database: string, schema: string, key: number): Promise<PlaylistItem | MediaItem | SubtitleItem | undefined> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    }
    return this.db.get(schema, key);
  }
  async getValueByIndex(database: string, schema: string, index: string, value: string | number): Promise<PlaylistItem | MediaItem | SubtitleItem | undefined> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    }
    return this.db.get(schema, index, value);
  }
  async getAllValueByIndex(database: string, schema: string, index: string, value: string | number): Promise<PlaylistItem[] | MediaItem[] | SubtitleItem[]> {
    if (database !== this.currentDB) {
      await this.getDB(database);
    }
    return this.db.getAllValueByIndex(schema, index, value);
  }
}

export const database = new DataBase();