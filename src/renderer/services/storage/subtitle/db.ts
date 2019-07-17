import { DBSchema, IDBPDatabase, openDB } from 'idb';
import {
  unionWith, uniqWith, remove, isEqual, some, keyBy, mergeWith, isFinite,
} from 'lodash';
import { LanguageCode } from '@/libs/language';
import { DATADB_NAME } from '@/constants';
import {
  Type, Format, Origin, VideoSegment,
} from '@/interfaces/ISubtitle';
import {
  StoredSubtitle, StoredSubtitleItem, SubtitlePreference, SelectedSubtitle,
} from '@/interfaces/ISubtitleStorage';

interface DataDBV2 extends DBSchema {
  'subtitles': {
    key: string;
    value: StoredSubtitle;
  };
  'preferences': {
    key: number;
    value: SubtitlePreference;
    indexes: {
      'byPlaylist': number,
      'byMediaItem': string,
    },
  };
}

interface AddSubtitleOptions {
  source: Origin;
  hash: string;
  format: Format;
  language: LanguageCode;
}
interface RemoveSubtitleOptions {
  source: unknown;
  hash: string;
}
interface UpdateSubtitleOptions {
  hash: string;
  source?: Origin;
  format?: Format;
  language?: LanguageCode;
}
interface UpdateSubtitleItemOptions {
  hash: string;
  type?: Type;
  source?: unknown;
  videoSegments?: VideoSegment[];
  delay?: number;
}

export class SubtitleDataBase {
  private db: IDBPDatabase<DataDBV2>;

  private async getDb() {
    if (!this.db) {
      this.db = await openDB<DataDBV2>(
        DATADB_NAME,
        3,
        {
          async upgrade(db, version) {
            if (version > 0 && version < 3) {
              db.deleteObjectStore('subtitles');
            }
            db.createObjectStore('subtitles', { keyPath: 'hash' });
            const preferenceStore = db.createObjectStore('preferences', { autoIncrement: true });
            preferenceStore.createIndex('byPlaylist', 'playlistId');
            preferenceStore.createIndex('byMediaItem', 'mediaId');
          },
        },
      );
    }
    return this.db;
  }

  public async retrieveSubtitle(hash: string) {
    return (await this.getDb())
      .transaction('subtitles', 'readonly')
      .objectStore('subtitles')
      .get(hash);
  }

  public async addSubtitle(subtitle: AddSubtitleOptions) {
    const objectStore = (await this.getDb())
      .transaction('subtitles', 'readwrite')
      .objectStore('subtitles');
    const storedSubtitle = await objectStore.get(subtitle.hash);
    if (!storedSubtitle) {
      return objectStore.add({
        ...subtitle,
        source: [subtitle.source],
      });
    }
    return objectStore.put({
      ...subtitle,
      source: uniqWith(storedSubtitle.source.concat(subtitle.source), isEqual),
    });
  }

  public async removeSubtitle(subtitle: RemoveSubtitleOptions) {
    const objectStore = (await this.getDb())
      .transaction('subtitles', 'readwrite')
      .objectStore('subtitles');
    const storedSubtitle = await objectStore.get(subtitle.hash);
    if (storedSubtitle) {
      remove(storedSubtitle.source, storedSource => isEqual(storedSource, subtitle.source));
      if (!storedSubtitle.source.length) {
        return objectStore.delete(subtitle.hash);
      }
      return objectStore.put({ ...storedSubtitle });
    }
    return undefined;
  }

  public async removeSubtitles(subtitles: RemoveSubtitleOptions[]) {
    const objectStore = await (await this.getDb())
      .transaction('subtitles', 'readwrite')
      .objectStore('subtitles');
    /** subtitles to delete */
    const hashSourcesMap: { [hash: string]: [] } = subtitles.reduce(
      (subs, { hash, source }) => {
        const existedSub = subs[hash];
        if (existedSub) existedSub.push(source);
        else subs[hash] = [source];
        return subs;
      },
      {},
    );
    let cursor = await objectStore.openCursor();
    const deletedSubtitleHashes: string[] = [];
    while (cursor && Object.keys(hashSourcesMap).length) {
      const { hash, source: storedSources } = cursor.value;
      const sourcesToDelete = hashSourcesMap[hash];
      if (sourcesToDelete) {
        remove(storedSources, ({ source }) => sourcesToDelete.some(sub => isEqual(sub, source)));
        if (!storedSources.length) await objectStore.delete(hash);
        else await objectStore.put(cursor.value);
        delete hashSourcesMap[hash];
        deletedSubtitleHashes.push(hash);
      }
      cursor = await cursor.continue();
    }
    return deletedSubtitleHashes;
  }

  public async updateSubtitle(subtitle: UpdateSubtitleOptions) {
    const objectStore = await (await this.getDb())
      .transaction('subtitles', 'readwrite')
      .objectStore('subtitles');
    const { source, format, language } = subtitle;
    const oldSubtitle = await objectStore.get(subtitle.hash);
    if (oldSubtitle) {
      const newSubtitle = { ...oldSubtitle };
      if (source) newSubtitle.source = unionWith(oldSubtitle.source.concat([source]), isEqual);
      if (format) newSubtitle.format = format;
      if (language) newSubtitle.language = language;
      return objectStore.put(newSubtitle);
    } if (source && format && language) {
      return this.addSubtitle(subtitle as AddSubtitleOptions);
    }
    return undefined;
  }

  public async retrieveSubtitlePreference(playlistId: number, mediaItemId: string) {
    let cursor = await ((await this.getDb())
      .transaction('preferences', 'readonly')
      .objectStore('preferences')
      .openCursor());
    while (cursor) {
      if (cursor.value.playlistId === playlistId && cursor.value.mediaId === mediaItemId) {
        return cursor.value;
      }
      cursor = await cursor.continue();
    }
    return undefined;
  }

  private static generateDefaultPreference(
    playlistId: number,
    mediaItemId: string,
  ): SubtitlePreference {
    return {
      playlistId,
      mediaId: mediaItemId,
      language: {
        primary: LanguageCode.Default,
        secondary: LanguageCode.Default,
      },
      list: [],
      selected: {
        primary: { hash: '' },
        secondary: { hash: '' },
      },
    };
  }

  public async retrieveSubtitleList(playlistId: number, mediaItemId: string) {
    const preference = await this.retrieveSubtitlePreference(playlistId, mediaItemId);
    return preference ? preference.list : [];
  }

  public async addSubtitleItemsToList(
    playlistId: number,
    mediaItemId: string,
    subtitles: StoredSubtitleItem[],
  ) {
    subtitles = uniqWith(subtitles, (
      { hash: hash1, source: source1 },
      { hash: hash2, source: source2 },
    ) => hash1 === hash2 && isEqual(source1, source2));
    const objectStore = (await this.getDb())
      .transaction('preferences', 'readwrite')
      .objectStore('preferences');
    let preference;
    let key;
    let cursor = await objectStore.openCursor();
    while (cursor && !preference && !key) {
      if (cursor.value.playlistId === playlistId && cursor.value.mediaId === mediaItemId) {
        preference = cursor.value;
        key = cursor.key;
      }
      cursor = await cursor.continue();
    }
    if (!preference) {
      return objectStore.add({
        ...SubtitleDataBase.generateDefaultPreference(playlistId, mediaItemId),
        list: subtitles,
      });
    }
    return objectStore.put({
      ...preference,
      list: unionWith(subtitles, preference.list, isEqual),
    }, key);
  }

  public async updateSubtitleList(
    playlistId: number,
    mediaItemId: string,
    subtitlesToUpdate: UpdateSubtitleItemOptions[],
  ) {
    subtitlesToUpdate = uniqWith(subtitlesToUpdate, (
      { hash: hash1, source: source1 },
      { hash: hash2, source: source2 },
    ) => hash1 === hash2 && isEqual(source1, source2));
    const objectStore = (await this.getDb())
      .transaction('preferences', 'readwrite')
      .objectStore('preferences');
    let preference;
    let list: StoredSubtitleItem[] = [];
    let key;
    let cursor = await objectStore.openCursor();
    while (cursor && !preference && !key) {
      if (cursor.value.playlistId === playlistId && cursor.value.mediaId === mediaItemId) {
        preference = cursor.value;
        list = Object.values(mergeWith(
          keyBy(preference.list, ({ hash }) => hash),
          keyBy(subtitlesToUpdate, ({ hash }) => hash),
          (objVal: StoredSubtitleItem, srcVal: StoredSubtitleItem) => {
            const destObj = { ...objVal };
            const {
              type, source, videoSegments, delay,
            } = srcVal;
            if (type) destObj.type = type;
            if (source) destObj.source = source;
            if (videoSegments) destObj.videoSegments = videoSegments;
            if (isFinite(delay)) destObj.delay = delay;
            return destObj;
          },
        ));
        key = cursor.key;
      }
      cursor = await cursor.continue();
    }
    if (!preference) {
      return objectStore.add({
        ...SubtitleDataBase.generateDefaultPreference(playlistId, mediaItemId), list,
      });
    }
    return objectStore.put({ ...preference, list }, key);
  }

  public async removeSubtitleItemsFromList(
    playlistId: number,
    mediaItemId: string,
    subtitles: StoredSubtitleItem[],
  ) {
    subtitles = uniqWith(subtitles, (
      { hash: hash1, source: source1 },
      { hash: hash2, source: source2 },
    ) => hash1 === hash2 && isEqual(source1, source2));
    const objectStore = (await this.getDb())
      .transaction('preferences', 'readwrite')
      .objectStore('preferences');
    let preference;
    let key;
    let cursor = await objectStore.openCursor();
    while (cursor && !preference && !key) {
      if (cursor.value.playlistId === playlistId && cursor.value.mediaId === mediaItemId) {
        preference = cursor.value;
        key = cursor.key;
      }
      cursor = await cursor.continue();
    }
    if (!preference) {
      return objectStore.add(SubtitleDataBase.generateDefaultPreference(playlistId, mediaItemId));
    }
    const { list: existedList } = preference;
    remove(existedList, sub => some(subtitles, sub));
    return objectStore.put({
      ...preference,
      list: existedList,
    }, key);
  }

  public async retrieveSubtitleLanguage(playlistId: number, mediaItemId: string) {
    const preference = await this.retrieveSubtitlePreference(playlistId, mediaItemId);
    return preference ? preference.language : {
      primary: LanguageCode.Default,
      secondary: LanguageCode.Default,
    };
  }

  public async storeSubtitleLanguage(
    playlistId: number,
    mediaItemId: string,
    languageCodes: LanguageCode[],
  ) {
    const objectStore = (await this.getDb())
      .transaction('preferences', 'readwrite')
      .objectStore('preferences');
    let preference;
    let key;
    let cursor = await objectStore.openCursor();
    while (cursor && !preference && !key) {
      if (cursor.value.playlistId === playlistId && cursor.value.mediaId === mediaItemId) {
        preference = cursor.value;
        key = cursor.key;
      }
      cursor = await cursor.continue();
    }

    if (!preference) {
      return objectStore.add({
        ...SubtitleDataBase.generateDefaultPreference(playlistId, mediaItemId),
        language: {
          primary: languageCodes[0],
          secondary: languageCodes[1],
        },
      });
    }
    return objectStore.put({
      ...preference,
      language: {
        primary: languageCodes[0],
        secondary: languageCodes[1],
      },
    }, key);
  }

  public async retrieveSelectedSubtitles(playlistId: number, mediaItemId: string) {
    const preference = await this.retrieveSubtitlePreference(playlistId, mediaItemId);
    return preference ? preference.selected : [];
  }

  public async storeSelectedSubtitles(
    playlistId: number,
    mediaItemId: string,
    subtitles: SelectedSubtitle[],
  ) {
    const objectStore = (await this.getDb())
      .transaction('preferences', 'readwrite')
      .objectStore('preferences');
    let preference;
    let key;
    let cursor = await objectStore.openCursor();
    while (cursor && !preference && !key) {
      if (cursor.value.playlistId === playlistId && cursor.value.mediaId === mediaItemId) {
        preference = cursor.value;
        key = cursor.key;
      }
      cursor = await cursor.continue();
    }
    if (!preference) {
      return objectStore.add({
        ...SubtitleDataBase.generateDefaultPreference(playlistId, mediaItemId),
        selected: {
          primary: subtitles[0],
          secondary: subtitles[1],
        },
      });
    }
    return objectStore.put({
      ...preference,
      selected: {
        primary: subtitles[0],
        secondary: subtitles[1],
      },
    }, key);
  }

  public async deleteSubtitlesByPlaylistId(playlistId: number) {
    const playlistStore = await (await this.getDb())
      .transaction('preferences', 'readwrite')
      .objectStore('preferences');
    let cursor = await playlistStore.openCursor();
    const subtitlesToRemove: RemoveSubtitleOptions[] = [];
    while (cursor) {
      if (cursor.value.playlistId === playlistId) {
        await playlistStore.delete(cursor.key);
        subtitlesToRemove.push(...cursor.value.list);
      }
      cursor = await cursor.continue();
    }
    return this.removeSubtitles(subtitlesToRemove);
  }
}
