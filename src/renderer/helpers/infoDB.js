
import idb from 'idb';

class InfoDB {
  /**
   * @param  {string} schema specify which schema
   *   you want to operate in Info databse
   *   create if doesn't exist
   */
  constructor(schema) {
    this.schema = schema;
  }

  add(data) {
    idb.open('Info').then((db) => {
      if (!db.objectStoreNames.contains(this.schema)) {
        idb.open('Info', db.version + 1, (upgradeDB) => {
          const store = upgradeDB.createObjectStore(this.schema, { keyPath: 'quickHash' });
          store.createIndex('lastOpened', 'lastOpened', { unique: false });
        }).then((db) => {
          const tx = db.transaction(this.schema, 'readwrite').objectStore(this.schema).put(data);
          return tx.complete;
        });
      }
    });
  }

  get(key) {
    return idb.open('Info').then(async (db) => {
      const value = await db.transaction(this.schema).objectStore(this.schema).get(key);
      return value;
    });
  }

  getAll() {
    return idb.open('Info').then(async (db) => {
      const tx = db.transaction(this.schema, 'readonly');
      const val = await tx.objectStore(this.schema).getAll();
      this.data = val;
      return tx.complete;
    });
  }
}

export default InfoDB;
