
import idb from 'idb';
import { INFO_DATABASE_NAME, INFO_SCHEMA, INFODB_VERSION } from '@/constants';
import addLog from './index';


/**
* You can change schema info in 'constants.js'
*/
export default class InfoDB {
  #db;

  /**
   * Create InfoDB if doesn't exist
   * Update InfoDB if new schema or new index has added
   */
  async getDB() {
    if (this.db) return this.db;
    this.db = await idb.open(INFO_DATABASE_NAME, INFODB_VERSION, (upgradeDB) => {
      INFO_SCHEMA.forEach((schema) => {
        let store;
        if (!upgradeDB.objectStoreNames.contains(schema.name)) {
          store = upgradeDB.createObjectStore(schema.name, { keyPath: 'quickHash' });
        } else {
          store = upgradeDB.transaction.objectStore(schema.name);
        }
        if (schema.indexes) {
          schema.indexes.forEach((val) => {
            if (!store.indexNames.contains(val)) store.createIndex(val, val);
          });
        }
      });
    });
    return this.db;
  }

  // clean All records in `storeName`, default to 'recent-played'
  async cleanData(storeName = 'recent-played') {
    const db = await this.getDB();
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    return tx.complete.then(() => {
      addLog.methods.addLog('info', `DB ${storeName} records all deleted`);
    });
  }

  /**
   * @param  {String} schema
   * @param  {Object} data Must contain quickHash property
   * Add a record if no same quickHash in the current schema
   * Replace a record if the given quickHash existed
   */
  async add(schema, data) {
    if (!data || !data.quickHash) throw new Error(`Invalid data: ${JSON.stringify(data)}`);
    const db = await this.getDB();
    addLog.methods.addLog('info', `adding ${data.path || JSON.stringify(data)} to ${schema}`);
    const tx = db.transaction(schema, 'readwrite');
    tx.objectStore(schema).put(data);
    return tx.complete.then(() => {
      addLog.methods.addLog('info', `added ${data.path || JSON.stringify(data)} to ${schema}`);
    });
  }

  /**
   * @param  {String} schema
   * @param  {String} quickHash
   * Delete the record which match the given quickHash
   */
  async delete(schema, quickHash) {
    addLog.methods.addLog('info', `deleting ${quickHash} from ${schema}`);
    const db = await this.getDB();
    const tx = db.transaction(schema, 'readwrite');
    tx.objectStore(schema).delete(quickHash);
    return tx.complete.then(() => {
      addLog.methods.addLog('info', `deleted ${quickHash} from ${schema}`);
    });
  }

  /**
   * Retrieve data of last played video from 'recent-played' schema
   */
  async lastPlayed() {
    const db = await this.getDB();
    const tx = db.transaction('recent-played');
    let val;
    tx.objectStore('recent-played').index('lastOpened').iterateCursor(null, 'prev', (cursor) => {
      if (!cursor) return;
      val = cursor.value;
    });
    return tx.complete.then(() => Promise.resolve(val));
  }

  /**
   * @param  {String} schema
   * @param  {String} key
   * @param  {String} direction
   * 'next'       This direction causes the cursor to be opened at the start of the source.
   * 'nextunique' Same as above, except: For duplicate values, only the first record is yielded.
   * 'prev'       This direction causes the cursor to be opened at the end of the source.
   * 'prevunique' Same as above, except: For duplicate values, only the first record is yielded.
   *  Return a sorted result with the given key and schema
   */
  async sortedResult(schema, key, direction) {
    const db = await this.getDB();
    const tx = db.transaction(schema);
    const res = [];
    tx.objectStore(schema).index(key).iterateCursor(null, direction, (cursor) => {
      if (!cursor) return;
      res.push(cursor.value);
      cursor.continue();
    });
    return tx.complete.then(() => Promise.resolve(res));
  }

  /**
   * @param  {String} schema
   * @param  {String} key Optional
   * @param  {String} val
   * Retrieve a record which Primary key equal to the given val if there's no specified key
   * Otherwise retrieve the record which specified key equal to the given val.
   */
  async get(schema, key, val) {
    const db = await this.getDB();
    if (val) {
      const value = await db.transaction(schema).objectStore(schema).index(key).get(val);
      return value;
    }
    val = key;
    const value = await db.transaction(schema).objectStore(schema).get(val);
    return value;
  }

  /**
   * @param  {String} schema
   * @param  {IDBKeyRange} keyRange Optional
   * https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange KeyRange Doc
   * Return all records from the given schema if no range specified
   */
  async getAll(schema, keyRange) {
    const db = await this.getDB();
    const tx = db.transaction(schema);
    let val;
    if (keyRange) {
      val = await tx.objectStore(schema).getAll(keyRange);
    } else {
      val = await tx.objectStore(schema).getAll();
    }
    return val;
  }
}

