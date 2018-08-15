
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
      console.log('[InfoDB]: Opening database Info.');
      console.time('Opening Info database');
      if (!db.objectStoreNames.contains(this.schema)) {
        console.log(`[InfoDB]: Database ${this.schema} not found.`);
        idb.open('Info', db.version + 1, (upgradeDB) => {
          console.log(`[InfoDB]: Creating database schema ${this.schema}.`);
          const store = upgradeDB.createObjectStore(this.schema, { keyPath: 'quickHash' });
          store.createIndex('lastOpened', 'lastOpened', { unique: false });
        }).then((db) => {
          console.timeEnd('Opening Info database');
          console.log(`[InfoDB]: Created database schema ${this.schema}.`);
          const tx = db.transaction(this.schema, 'readwrite').objectStore(this.schema).put(data);
          return tx.complete;
        });
      }
      db.transaction(this.schema, 'readwrite').objectStore(this.schema).put(data);
      return db.transaction.complete;
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
