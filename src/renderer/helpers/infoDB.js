import { openDb } from 'idb';
import { INFO_DATABASE_NAME, INFO_SCHEMAS, INFODB_VERSION, RECENT_OBJECT_STORE_NAME, VIDEO_OBJECT_STORE_NAME } from '@/constants';
import Helpers from '@/helpers';
import addLog from './index';

/**
 * You can change schema info in 'constants.js'
 */
export class InfoDB {
  #db;

  /**
   * Create InfoDB if doesn't exist
   * Update InfoDB if new schema or new index has added
   */
  async getDB() {
    if (this.db) return this.db;
    this.db = await openDb(
      INFO_DATABASE_NAME, INFODB_VERSION,
      async (upgradeDB) => {
        if (upgradeDB.oldVersion < 1) {
          INFO_SCHEMAS.forEach(({ name, options, indexes }) => {
            const store = upgradeDB.createObjectStore(name, options);
            if (indexes) {
              indexes.forEach((val) => {
                if (!store.indexNames.contains(val)) store.createIndex(val, val);
              });
            }
          });
        } else {
          const oldRecords = await upgradeDB.transaction
            .objectStore(RECENT_OBJECT_STORE_NAME).getAll();
          await upgradeDB.deleteObjectStore(RECENT_OBJECT_STORE_NAME);
          INFO_SCHEMAS.forEach(({ name, options, indexes }) => {
            const store = upgradeDB.createObjectStore(name, options);
            if (indexes) {
              indexes.forEach((val) => {
                store.createIndex(val, val);
              });
            }
          });

          /* eslint-disable */
          for (const data of oldRecords) {
            if (!data.type) {
              const convertedData = {
                items: [],
                hpaths: [`${data.path}-${data.quichHash}`],
                playedIndex: 0,
                lastOpened: data.lastOpened,
              };
              const videoid = await upgradeDB.transaction.objectStore(VIDEO_OBJECT_STORE_NAME).add(data);
              console.log(`video: ${videoid}`);
              convertedData.items.push(videoid);
              await upgradeDB.transaction.objectStore(RECENT_OBJECT_STORE_NAME).add(convertedData);
            } else {
              const convertedData = {
                items: [],
                hpaths: [],
                playedIndex: 0,
                lastOpened: data.lastOpened,
              };
              for (const playlistItem of data.infos) {
                const videoid = await upgradeDB.transaction.objectStore(VIDEO_OBJECT_STORE_NAME).add(playlistItem);
                convertedData.items.push(videoid);
                console.log(`video in playlist: ${videoid}`);
                convertedData.hpaths.push(`${playlistItem.path}-${playlistItem.quickHash}`);
              }
              await upgradeDB.transaction.objectStore(RECENT_OBJECT_STORE_NAME).add(convertedData);
            }
          }
        }
      },
    );
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
   * @param  {Object} data
   * Add a new record
   */
  async add(schema, data) {
    if (!data) throw new Error(`Invalid data: ${JSON.stringify(data)}`);
    const db = await this.getDB();
    addLog.methods.addLog('info', `adding ${JSON.stringify(data)} to ${schema}`);
    const tx = db.transaction(schema, 'readwrite');
    tx.objectStore(schema).add(data);
    return tx.complete.then(() => {
      addLog.methods.addLog('info', `added ${JSON.stringify(data)} to ${schema}`);
    }, (err) => {
      addLog.methods.addLog('error', `failed to add ${JSON.stringify(data)} to ${schema}`);
    });
  }
  
  /**
   * @param  {String} schema
   * @param  {Object} data
   * Add a record if no same quickHash in the current schema
   * Replace a record if the given quickHash existed
   */
  async put(schema, data) {
    if (!data || !data.quickHash) throw new Error(`Invalid data: ${JSON.stringify(data)}`);
    const db = await this.getDB();
    addLog.methods.addLog('info', `puting ${JSON.stringify(data)} to ${schema}`);
    const tx = db.transaction(schema, 'readwrite');
    tx.objectStore(schema).put(data);
    return tx.complete.then(() => {
      addLog.methods.addLog('info', `put ${JSON.stringify(data)} to ${schema}`);
    }, (err) => {
      addLog.methods.addLog('error', `failed to put ${JSON.stringify(data)} to ${schema}`);
    });
  }

  /**
   * @param  {String} schema
   * @param  {String} key
   * Delete the record which match the given key
   */
  async delete(schema, key) {
    addLog.methods.addLog('info', `deleting ${key} from ${schema}`);
    const db = await this.getDB();
    const tx = db.transaction(schema, 'readwrite');
    tx.objectStore(schema).delete(key);
    return tx.complete;
  }

  /**
   * @param  {String} id
   * Delete the playlist and its contained media items which match the given id
   */
  async deletePlaylist(id) {
    addLog.methods.addLog('info', `deleting ${id} from recent-played`);
    const db = await this.getDB();
    const playlistItems = this.get('recent-played', id).items;
    for (const item of playlistItems) {
      await this.delete('media-item', item);
    }
    return this.delete('recent-played', id);
  }

  /**
   * @param  {Array} videos
   * Add a new playlist to recent-played and add the corresponding media-items
   */
  async addPlaylist(...videos) {
    const playlist = {
      items: [],
      hpaths: [],
      playedIndex: 0,
      lastOpened: Date.now(),
    };
    const db = await this.getDB();
    for (const videoPath of videos) {
      const hash = await Helpers.methods.mediaQuickHash(videoPath);
      const data = {
        hash,
        type: 'video',
        path: videoPath,
        source: 'playlist',
      };
      const videoId = await this.add('media-item', data);
      playlist.items.push(videoId);
      playlist.hpaths.push(`${videoPath}-${hash}`);
    }
    return this.add('recent-played', playlist);
  }

  /**
   * Retrieve data of last played video from 'recent-played' schema
   */
  async lastPlayed() {
    const db = await this.getDB();
    const tx = db.transaction('recent-played');
    let val;
    tx.objectStore('recent-played')
      .index('lastOpened')
      .iterateCursor(null, 'prev', (cursor) => {
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
    tx.objectStore(schema)
      .index(key)
      .iterateCursor(null, direction, (cursor) => {
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
      const value = await db
        .transaction(schema)
        .objectStore(schema)
        .index(key)
        .get(val);
      return value;
    }
    val = key;
    const value = await db
      .transaction(schema)
      .objectStore(schema)
      .get(val);
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

export default new InfoDB();
