
import idb from 'idb';
import { INFO_SCHEMA } from '@/constants';

class InfoDB {
  constructor() {
    this.version = 1;
    this.data = new Map();
  }
  /**
   * Create InfoDB if doesn't exist
   * Update InfoDB if new schema or new index has added
   */
  init() {
    return idb.open('Info').then((db) => {
      this.version = db.version;
      const updateStore = [];
      for (let i = 0; i < INFO_SCHEMA.length; i += 1) {
        const schema = INFO_SCHEMA[i];
        if (!db.objectStoreNames.contains(schema.name)) {
          updateStore.push(schema);
        } else if (schema.indexes) {
          for (let j = 0; j < schema.indexes.length; j += 1) {
            const index = schema.indexes[j];
            if (!db.transaction(schema.name).objectStore(schema.name).indexNames.contains(index)) {
              updateStore.push(schema);
              break;
            }
          }
        }
      }

      if (updateStore.length !== 0) {
        idb.open('Info', db.version + 1, (upgradeDB) => {
          updateStore.forEach((schema) => {
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
      }
    });
  }
  /**
   * @param  {String} schema
   * @param  {Object} data Must contain quickHash property
   * Add a record if no same quickHash in the current schema
   * Replace a record if the given quickHash existed
   */
  add(schema, data) {
    console.log('adding');
    return idb.open('Info').then((db) => {
      console.log(this.version);
      const tx = db.transaction(schema, 'readwrite');
      tx.objectStore(schema).put(data);
      return tx.complete.then(() => console.log('added'));
    });
  }
  /**
   * @param  {String} schema
   * @param  {String} val
   * Delete the record which Primary key equal to the given val
   */
  delete(schema, val) {
    console.log('deleting');
    return idb.open('Info').then((db) => {
      console.log(this.version);
      const tx = db.transaction(schema, 'readwrite');
      tx.objectStore(schema).delete(val);
      return tx.complete.then(() => console.log('deleted'));
    });
  }
  /**
   * Retrieve data of last played video from 'recent-played' schema
   */
  lastPlayed() {
    console.log(this.data);
    return idb.open('Info').then((db) => {
      const tx = db.transaction('recent-played');
      let val;
      tx.objectStore('recent-played').index('lastOpened').iterateCursor(null, 'prev', (cursor) => {
        if (!cursor) return;
        val = cursor.value;
      });
      return tx.complete.then(() => Promise.resolve(val));
    });
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
  sortedResult(schema, key, direction) {
    console.log(this.data);
    return idb.open('Info').then((db) => {
      const tx = db.transaction(schema);
      const res = [];
      tx.objectStore(schema).index(key).iterateCursor(null, direction, (cursor) => {
        if (!cursor) return;
        res.push(cursor.value);
        cursor.continue();
      });
      return tx.complete.then(() => {
        this.data = res;
        return Promise.resolve(res);
      });
    });
  }
  /**
   * @param  {String} schema
   * @param  {String} key Optional
   * @param  {String} val
   * Retrieve a record which Primary key equal to the given val if there's no specified key
   * Otherwise retrieve the record which specified key equal to the given val.
   */
  get(schema, key, val) {
    console.log(this.data);
    if (val) {
      return idb.open('Info').then(async (db) => {
        const value = await db.transaction(schema).objectStore(schema).index(key).get(val);
        return value;
      });
    }
    val = key;
    return idb.open('Info').then(async (db) => {
      const value = await db.transaction(schema).objectStore(schema).get(val);
      return value;
    });
  }
  /**
   * @param  {String} schema
   * @param  {IDBKeyRange} keyRange Optional
   * https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange KeyRange Doc
   * Return all records from the given schema if no range specified
   */
  getAll(schema, keyRange) {
    return idb.open('Info').then(async (db) => {
      const tx = db.transaction(schema);
      let val;
      if (keyRange) {
        val = await tx.objectStore(schema).getAll(keyRange);
      } else {
        val = await tx.objectStore(schema).getAll();
      }
      this.data.set(schema, val);
      return val;
    });
  }
}

export default new InfoDB();

