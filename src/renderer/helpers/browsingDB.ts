
import { openDB, IDBPDatabase, DBSchema } from 'idb';
import {
  BROWSINGDB_NAME,
  HISTORY_OBJECT_STORE_NAME,
  BROWSINGDB_VERSION,
} from '@/constants';
import { log } from '@/libs/Log';

export type BrowsingHistoryItem = {
  url: string,
  title: string,
  channel: string,
  openTime: number,
};

interface IBrowsingDB extends DBSchema {
  history: {
    key: string,
    value: BrowsingHistoryItem,
    indexes: { 'openTime': number };
  },
}

export default class BrowsingDB {
  public async getDB(): Promise<IDBPDatabase<IBrowsingDB>> {
    return openDB<IBrowsingDB>(
      BROWSINGDB_NAME, BROWSINGDB_VERSION, {
        upgrade(db) {
          const historyStore = db.createObjectStore(
            HISTORY_OBJECT_STORE_NAME, { keyPath: 'url' },
          );
          historyStore.createIndex('openTime', 'openTime');
        },
      },
    );
  }

  public async add(objectStore: 'history', data: BrowsingHistoryItem): Promise<IDBValidKey> {
    if (!data) throw new Error(`BrowsingDB | Invalid data: ${JSON.stringify(data)}`);
    const db = await this.getDB();
    return db.add(objectStore, data);
  }

  public async put(objectStore: 'history', data: BrowsingHistoryItem): Promise<IDBValidKey> {
    if (!data) throw new Error(`BrowsingDB | Invalid data: ${JSON.stringify(data)}`);
    const db = await this.getDB();
    return db.put(objectStore, data);
  }

  public async update(
    objectStore: 'history', keyPath: number, data: BrowsingHistoryItem,
  ): Promise<IDBValidKey> {
    if (!data.url) throw new Error('BrowsingDB | Invalid data: Require URL !');
    const db = await this.getDB();
    if (!keyPath) {
      throw new Error('Providing out-of-line objectStore without keyPathVal is invalid.');
    }
    log.info('BrowsingDB', `Updating ${keyPath} to ${objectStore}`);
    return db.put(objectStore, data);
  }

  public async delete(objectStore: 'history', key: string): Promise<undefined> {
    log.info('BrowsingDB', `deleting ${key} from ${objectStore}`);
    const db = await this.getDB();
    return db.delete(objectStore, key);
  }

  public async clear(objectStore: 'history'): Promise<undefined> {
    const db = await this.getDB();
    const tx = db.transaction(objectStore, 'readwrite');
    tx.store.clear();
    return tx.done;
  }

  public async getAll(objectStore: 'history', keyRange?: IDBKeyRange): Promise<BrowsingHistoryItem[]> {
    const db = await this.getDB();
    const val = await db.getAll(objectStore, keyRange);
    return val;
  }

  public async getValueByKey(objectStore: 'history', key: string): Promise<BrowsingHistoryItem | undefined> {
    if (!key) throw new Error(`BrowsingDB | Invalid get method: ${key} to ${objectStore}`);
    const db = await this.getDB();
    const value = await db.get(objectStore, key);
    return value;
  }

  public async getValueByIndex(
    objectStore: 'history', index: 'openTime', value: number,
  ): Promise<BrowsingHistoryItem | undefined> {
    if (!index) throw new Error(`BrowsingDB | Invalid get method: ${index} to ${objectStore}`);
    const db = await this.getDB();
    const val = await db.getFromIndex(objectStore, index, value);
    return val;
  }

  public async getAllValueByIndex(
    objectStore: 'history', index: 'openTime', value: string | number,
  ): Promise<BrowsingHistoryItem[]> {
    const db = await this.getDB();
    const res = [];
    let cursor = await db
      .transaction(objectStore)
      .store
      .index(index)
      .openCursor(undefined, 'next');
    while (cursor) {
      if (cursor.value[index] === value) res.push(cursor.value);
      cursor = await cursor.continue();
    }
    return res;
  }
}

export const browsingDB = new BrowsingDB();
