import { openDB, IDBPDatabase } from 'idb';
import {
  INFO_DATABASE_NAME,
  INFO_SCHEMAS,
  INFODB_VERSION,
  RECENT_OBJECT_STORE_NAME,
  VIDEO_OBJECT_STORE_NAME,
} from '@/constants';
import { mediaQuickHash } from '@/libs/utils';
import { RawPlaylistItem, PlaylistItem, MediaItem } from '@/interfaces/IDB';
import { log } from '@/libs/Log';

/**
 * You can change schema info in 'constants.js'
 */
export class InfoDB {
  public db: IDBPDatabase;

  /**
   * Create InfoDB if doesn't exist
   * Update InfoDB if new schema or new index has added
   */
  public async getDB(): Promise<IDBPDatabase> {
    if (this.db) return this.db;
    this.db = await openDB(
      INFO_DATABASE_NAME, INFODB_VERSION, {
        upgrade(db: IDBPDatabase, oldVersion: number) {
          if (oldVersion === 1) {
            db.deleteObjectStore(RECENT_OBJECT_STORE_NAME);
          } else if (oldVersion === 2) {
            db.deleteObjectStore(RECENT_OBJECT_STORE_NAME);
            db.deleteObjectStore(VIDEO_OBJECT_STORE_NAME);
          }
          INFO_SCHEMAS.forEach(({ name, options, indexes }) => {
            const store = db.createObjectStore(name, options);
            if (indexes) {
              indexes.forEach((val) => {
                store.createIndex(val, val);
              });
            }
          });
        },
      },
    );
    return this.db;
  }

  // deprecated! will be deleted soon
  // clean All records in `storeName`, default to 'recent-played'
  public async cleanData(storeName = 'recent-played') {
    const db = await this.getDB();
    const tx = db.transaction(storeName, 'readwrite');
    tx.store.clear();
    return tx.done.then(() => {
      log.info('infoDB', `DB ${storeName} records all deleted`);
    });
  }

  // formatted, equal to the previous method
  public async clear(storeName: string) {
    const db = await this.getDB();
    const tx = db.transaction(storeName, 'readwrite');
    tx.store.clear();
    return tx.done;
  }

  public async clearAll() {
    await this.cleanData();
    await this.cleanData('media-item');
  }

  /**
   * @param  {String} schema
   * @param  {Object} data
   * Add a new record
   */
  public async add(schema: string, data: any) {
    if (!data) throw new Error(`Invalid data: ${JSON.stringify(data)}`);
    const db = await this.getDB();
    return db.add(schema, data);
  }

  /**
   * @param  {String} schema
   * @param  {Object} data
   * Add a record if no same quickHash in the current schema
   * Replace a record if the given quickHash existed
   */
  public async update(schema: string, data: any, keyPath: number) {
    if (!data.id && !data.videoId) throw new Error('Invalid data: Require Media ID !');
    const db = await this.getDB();
    if (!keyPath) {
      throw new Error('Providing out-of-line objectStore without keyPathVal is invalid.');
    }
    log.info('infoDB', `Updating ${keyPath} to ${schema}`);
    return db.put(schema, data);
  }

  /**
   * @param  {String} schema
   * @param  {String} key
   * Delete the record which match the given key
   */
  public async delete(schema: string, key: number) {
    log.info('infoDB', `deleting ${key} from ${schema}`);
    const db = await this.getDB();
    return db.delete(schema, key);
  }

  /**
   * @param  {String} id
   * Delete the playlist and its contained media items which match the given id
   */
  public async deletePlaylist(id: number) {
    log.info('infoDB', `deleting ${id} from recent-played`);
    const playlistItem = await this.get('recent-played', id);
    /* eslint-disable */
    for (const item of playlistItem.items) {
      try {
        // skip if item not exist
        await this.delete('media-item', item);
      } catch(err) {}
    }
    return this.delete('recent-played', id);
  }

  /**
   * @param  {Array} videos
   * Add a new playlist to recent-played and add the corresponding media-items
   */
  async addPlaylist(videos: string[]) {
    let playlist: RawPlaylistItem = {
      items: [],
      hpaths: [],
      playedIndex: 0,
      lastOpened: Date.now(),
    };
    if (videos.length > 1) {
      for (const videoPath of videos) {
        const quickHash = await mediaQuickHash.try(videoPath);
        if (quickHash) {
          const data = {
            quickHash,
            type: 'video',
            path: videoPath,
            source: 'playlist',
          };
          const videoId = await this.add('media-item', data) as number;
          playlist.items.push(videoId);
          playlist.hpaths.push(`${quickHash}-${videoPath}`);
        }
      }
    } else if (videos.length === 1) {
      const quickHash = await mediaQuickHash.try(videos[0]);
      const playlistRecord: PlaylistItem = await this.get('recent-played', 'hpaths', [`${quickHash}-${videos[0]}`]);
      if (quickHash && playlistRecord) {
        playlistRecord.lastOpened = Date.now();
        await this.update('recent-played', playlistRecord, playlistRecord.id);
        return playlistRecord.id;
      } else if (quickHash) {
        const data = {
          quickHash,
          type: 'video',
          path: videos[0],
          source: '',
        };
        const videoId = await this.add('media-item', data) as number;
        playlist.items.push(videoId);
        playlist.hpaths.push(`${quickHash}-${videos[0]}`);
      }
    }
    return this.add('recent-played', playlist);
  }

  /**
   * Retrieve data of last played video from 'recent-played' schema
   */
  async lastPlayed() {
    const db = await this.getDB();
    let val: PlaylistItem | undefined;
    const cursor = await db
      .transaction('recent-played')
      .store
      .index('lastOpened')
      .openCursor(undefined, 'prev');
    if (cursor) val = cursor.value;
    return val;
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
  async sortedResult(schema: string, indexName: string, direction: IDBCursorDirection) {
    const db = await this.getDB();
    const res: PlaylistItem[] | MediaItem[] = [];
    let cursor = await db
      .transaction(schema)
      .store
      .index(indexName)
      .openCursor(undefined, direction);
    while (cursor) {
      res.push(cursor.value);
      cursor = await cursor.continue();
    }
    return res;
  }

  /**
   * @param  {String} schema
   * @param  {String} key
   * @param  {String} val Optional
   * Retrieve a record which Primary key equal to the given val if there's no specified key
   * Otherwise retrieve the record which specified key equal to the given val.
   */
  async get(schema: string, key: string | any, val?: any) {
    if (!key) throw new Error(`Invalid get method: ${key} to ${schema}`);
    const db = await this.getDB();
    if (val) {
      const value = await db.getFromIndex(schema, key, val);
      return value;
    }
    const value = await db.get(schema, key);
    return value;
  }

  /**
   * @param  {String} schema
   * @param  {String} key
   * @param  {Any} value
   * Return the specified records that equal to value from the given schema
   */
  async getAllValueByIndex(schema: string, indexName: string, value: any) {
    const db = await this.getDB();
    const res: PlaylistItem[] | MediaItem[] = [];
    let cursor = await db
      .transaction(schema)
      .store
      .index(indexName)
      .openCursor(undefined, 'next');
    while (cursor) {
      if (cursor.value[indexName] === value) res.push(cursor.value);
      cursor = await cursor.continue();
    }
    return res;
  }

  /**
   * @param  {String} schema
   * @param  {IDBKeyRange} keyRange Optional
   * https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange KeyRange Doc
   * Return all records from the given schema if no range specified
   */
  async getAll(schema: string, keyRange?: IDBKeyRange) {
    const db = await this.getDB();
    const val = await db.getAll(schema, keyRange);
    return val;
  }
}

export default new InfoDB();
