
import { openDB, IDBPDatabase, DBSchema } from 'idb';
import {
  DOWNLOADDB_NAME,
  DOWNLOAD_OBJECT_STORE_NAME,
  DOWNLOADDB_VERSION,
} from '@/constants';
import { log } from '@/libs/Log';

export type BrowsingDownloadItem = {
  id: string,
  downloadId: string,
  url: string,
  name: string,
  path: string,
  size: number,
  progress: number,
};

interface IDownloadDB extends DBSchema {
  download: {
    key: string,
    value: BrowsingDownloadItem,
    indexes: {
      'id': string,
    },
  },
}

export default class DownloadDB {
  public async getDB(): Promise<IDBPDatabase<IDownloadDB>> {
    return openDB<IDownloadDB>(
      DOWNLOADDB_NAME, DOWNLOADDB_VERSION, {
        upgrade(db) {
          const downloadStore = db.createObjectStore(
            DOWNLOAD_OBJECT_STORE_NAME, { keyPath: 'id' },
          );
          downloadStore.createIndex('id', 'id');
        },
      },
    );
  }

  public async add(objectStore: 'download', data: BrowsingDownloadItem): Promise<IDBValidKey> {
    if (!data) throw new Error(`DownloadDB | Invalid data: ${JSON.stringify(data)}`);
    const db = await this.getDB();
    return db.add(objectStore, data);
  }

  public async put(objectStore: 'download', data: BrowsingDownloadItem): Promise<IDBValidKey> {
    if (!data) throw new Error(`DownloadDB | Invalid data: ${JSON.stringify(data)}`);
    const db = await this.getDB();
    return db.put(objectStore, data);
  }

  public async update(
    objectStore: 'download', keyPath: string, data: BrowsingDownloadItem,
  ): Promise<IDBValidKey> {
    if (!data.id) throw new Error('DownloadDB | Invalid data: Require URL !');
    const db = await this.getDB();
    if (!keyPath) {
      throw new Error('Providing out-of-line objectStore without keyPathVal is invalid.');
    }
    log.info('DownloadDB', `Updating ${keyPath} to ${objectStore}`);
    return db.put(objectStore, data);
  }

  public async delete(objectStore: 'download', key: string): Promise<undefined> {
    log.info('DownloadDB', `deleting ${key} from ${objectStore}`);
    const db = await this.getDB();
    return db.delete(objectStore, key);
  }

  public async clear(objectStore: 'download'): Promise<undefined> {
    const db = await this.getDB();
    const tx = db.transaction(objectStore, 'readwrite');
    tx.store.clear();
    return tx.done;
  }

  public async getAll(objectStore: 'download', keyRange?: IDBKeyRange): Promise<BrowsingDownloadItem[]> {
    const db = await this.getDB();
    const val = await db.getAll(objectStore, keyRange);
    return val;
  }

  public async getValueByKey(objectStore: 'download', key: string): Promise<BrowsingDownloadItem | undefined> {
    if (!key) throw new Error(`DownloadDB | Invalid get method: ${key} to ${objectStore}`);
    const db = await this.getDB();
    const value = await db.get(objectStore, key);
    return value;
  }

  public async getValueByIndex(
    objectStore: 'download', index: 'id', value: string,
  ): Promise<BrowsingDownloadItem | undefined> {
    if (!index) throw new Error(`DownloadDB | Invalid get method: ${index} to ${objectStore}`);
    const db = await this.getDB();
    const val = await db.getFromIndex(objectStore, index, value);
    return val;
  }

  public async getAllValueByIndex(
    objectStore: 'download', index: 'id', value: string,
  ): Promise<BrowsingDownloadItem[]> {
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

export const downloadDB = new DownloadDB();
