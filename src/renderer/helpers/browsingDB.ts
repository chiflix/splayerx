
import { openDB, IDBPDatabase, DBSchema } from 'idb';
import {
  BROWSINGDB_NAME,
  HISTORY_OBJECT_STORE_NAME,
  BROWSINGDB_VERSION,
} from '@/constants';
import { log } from '@/libs/Log';

type BrowsingHistoryItem = {

};

interface IBrowsingDB extends DBSchema {
  history: {
    key: number,
    value: BrowsingHistoryItem,
  },
}

export default class BrowsingDB {
  public async getDB(): Promise<IDBPDatabase> {
    return openDB(
      BROWSINGDB_NAME, BROWSINGDB_VERSION, {
        upgrade(db: IDBPDatabase) {
          const historyStore = db.createObjectStore(
            HISTORY_OBJECT_STORE_NAME, { keyPath: 'id', autoIncrement: true },
          );
          historyStore.createIndex('last-opened-time', 'last-opened-time');
        },
      },
    );
  }

  public async add(objectStore: string, data: BrowsingHistoryItem): Promise<IDBValidKey> {
    if (!data) throw new Error(`BrowsingDB | Invalid data: ${JSON.stringify(data)}`);
    const db = await this.getDB();
    return db.add(objectStore, data);
  }

  public async update(
    objectStore: string, keyPath: number, data: Record<string, unknown>,
  ): Promise<IDBValidKey> {
    if (!data.id) throw new Error('BrowsingDB | Invalid data: Require ID !');
    const db = await this.getDB();
    if (!keyPath) {
      throw new Error('Providing out-of-line objectStore without keyPathVal is invalid.');
    }
    log.info('BrowsingDB', `Updating ${keyPath} to ${objectStore}`);
    return db.put(objectStore, data);
  }

  public async delete(objectStore: string, key: number): Promise<undefined> {
    log.info('BrowsingDB', `deleting ${key} from ${objectStore}`);
    const db = await this.getDB();
    return db.delete(objectStore, key);
  }

  public async clear(objectStore: string): Promise<undefined> {
    const db = await this.getDB();
    const tx = db.transaction(objectStore, 'readwrite');
    tx.store.clear();
    return tx.done;
  }

  public async getAll(objectStore: string, keyRange: IDBKeyRange): Promise<BrowsingHistoryItem[]> {
    const db = await this.getDB();
    const val = await db.getAll(objectStore, keyRange);
    return val;
  }

  public async getValueByKey(objectStore: string, key: number): Promise<BrowsingHistoryItem> {
    if (!key) throw new Error(`BrowsingDB | Invalid get method: ${key} to ${objectStore}`);
    const db = await this.getDB();
    const value = await db.get(objectStore, key);
    return value;
  }

  public async getValueByIndex(
    objectStore: string, index: string, value: string | number,
  ): Promise<BrowsingHistoryItem> {
    if (!index) throw new Error(`BrowsingDB | Invalid get method: ${index} to ${objectStore}`);
    const db = await this.getDB();
    const val = await db.getFromIndex(objectStore, index, value);
    return val;
  }

  public async getAllValueByIndex(
    objectStore: string, index: string, value: string | number,
  ): Promise<BrowsingHistoryItem> {
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
