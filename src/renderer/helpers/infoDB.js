
import idb from 'idb';
import { INFO_SCHEMA } from '@/constants';

class InfoDB {
  constructor() {
    this.version = 1;
  }

  init() {
    return idb.open('Info').then((db) => {
      this.version = db.version;
      const updateStore = [];
      for (let i = 0; i < INFO_SCHEMA.length; i += 1) {
        const schema = INFO_SCHEMA[i];
        if (!db.objectStoreNames.contains(schema.name)) {
          updateStore.push(schema);
        }
      }
      if (updateStore.length !== 0) {
        idb.open('Info', db.version + 1, (upgradeDB) => {
          updateStore.forEach((val) => {
            const store = upgradeDB.createObjectStore(val.name, { keyPath: 'quickHash' });
            if (val.indexes) {
              val.indexes.forEach((val) => {
                store.createIndex(val, val);
              });
            }
          });
        });
      }
    });
  }

  add(schema, data) {
    console.log('adding');
    return idb.open('Info').then((db) => {
      console.log(this.version);
      const tx = db.transaction(schema, 'readwrite').objectStore(schema).put(data);
      return tx.complete;
    });
  }

  get(schema, key) {
    console.log(this.version);
    return idb.open('Info').then(async (db) => {
      const value = await db.transaction(schema).objectStore(schema).get(key);
      return value;
    });
  }

  getAll(schema) {
    return idb.open('Info').then(async (db) => {
      const tx = db.transaction(schema);
      const val = await tx.objectStore(schema).getAll();
      this.data = val;
      return val;
    });
  }
}

export default new InfoDB();

