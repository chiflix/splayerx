import { openDb } from 'idb';
import { includes } from 'lodash';
import { DATADB_NAME as dBName, DATADB_SHCEMAS as schemas } from '@/constants';

export class DataDb {
  #db;
  #version;
  #schema;

  /**
   * retrieve or createDb with dbName, version and schema
   * alter existing db's schema when not matching
   *
   * @static
   * @param {number} version the version of the wanted database
   * @param {object} schema schema need to be updated
   * @returns the specific database
   * @memberof DataDb
   */
  static async getDb(version, schema) {
    return openDb(dBName, version, (upgradeDb) => {
      const { objectStoreNames } = upgradeDb;
      schema.forEach(({ name, options, indexes }) => {
        if (!objectStoreNames.contains(name)) {
          const store = upgradeDb.createObjectStore(name, options);
          (indexes || []).forEach(({ name, keyPath, options }) => {
            if (name) store.createIndex(name, keyPath || name, options);
          });
        } else {
          const store = upgradeDb.transaction.objectStore(name);
          const { indexNames } = store;

          const indexesToDelete = Array.from(indexNames)
            .filter(name => !includes(indexes, name));
          indexesToDelete.forEach(store.deleteIndex);

          const indexesToCreate = indexes
            .filter(({ name }) => !indexNames.contains(name));
          indexesToCreate
            .forEach(({ name, keyPath, options }) => store.createIndex(name, keyPath, options));
        }
      });
    });
  }

  constructor(version, schema) {
    this.version = version;
    this.schema = schema;
  }

  async getOwnDb() {
    if (this.db) return this.db;
    this.db = await DataDb.getDb(this.version, this.schema);
    return this.db;
  }

  async get(objectStoreName, index, val) {
    const db = await this.getOwnDb();
    if (val) {
      return db
        .transaction(objectStoreName)
        .objectStore(objectStoreName)
        .index(index)
        .get(val);
    }
    return db
      .transaction(objectStoreName)
      .objectStore(objectStoreName)
      .get(index);
  }

  async add(objectStoreName, data) {
    const db = await this.getOwnDb();
    const { objectStoreNames } = db;
    if (!objectStoreNames.contains(objectStoreName)) {
      throw new Error(`Object store ${objectStoreName} does not exist. Add them to constant.js please.`);
    }
    const tx = db.transaction(objectStoreName, 'readwrite');
    tx.objectStore(objectStoreName).put(data);
    return tx.complete;
  }
}

export default new DataDb(schemas[0].version, schemas[0].schema);
