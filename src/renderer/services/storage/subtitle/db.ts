import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { LanguageCode } from '@/libs/language';
import { DATADB_NAME } from '@/constants';
import { Format, Origin } from '@/interfaces/ISubtitle';
import { StoredSubtitle, StoredSubtitleItem, SubtitlePreference, SelectedSubtitle } from '@/interfaces/ISubtitleStorage';
import { unionWith, uniqWith, remove, isEqual, some } from 'lodash';

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
  source: Origin;
  hash: string;
}

export class SubtitleDataBase {
  private db: IDBPDatabase<DataDBV2>;
  private async getDb() {
    return this.db ? this.db : this.db = await openDB<DataDBV2>(
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
        }
      },
    );
  }

  async retrieveSubtitle(hash: string) {
    return (await this.getDb())
      .transaction('subtitles', 'readonly')
      .objectStore('subtitles')
      .get(hash);
  }
  async addSubtitle(subtitle: AddSubtitleOptions) {
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
  async removeSubtitle(subtitle: RemoveSubtitleOptions) {
    const objectStore = (await this.getDb())
      .transaction('subtitles', 'readwrite')
      .objectStore('subtitles');
    const storedSubtitle = await objectStore.get(subtitle.hash);
    if (storedSubtitle) {
      remove(storedSubtitle.source, storedSource => isEqual(storedSource, subtitle.source));
      if (!storedSubtitle.source.length) {
        return objectStore.delete(subtitle.hash);
      } else {
        return objectStore.put({ ...storedSubtitle });
      }
    }
  }

  async retrieveSubtitlePreference(playlistId: number, mediaItemId: string) {
    let cursor = await ((await this.getDb())
      .transaction('preferences', 'readonly')
      .objectStore('preferences')
      .openCursor());
    while (cursor) {
      if (cursor.value.playlistId === playlistId && cursor.value.mediaId === mediaItemId) return cursor.value;
      cursor = await cursor.continue();
    }
  }
  private generateDefaultPreference(playlistId: number, mediaItemId: string): SubtitlePreference {
    return {
      playlistId, mediaId: mediaItemId,
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
  async retrieveSubtitleList(playlistId: number, mediaItemId: string) {
    const preference =  await this.retrieveSubtitlePreference(playlistId, mediaItemId);
    return preference ? preference.list : [];
  }
  async addSubtitleItemsToList(playlistId: number, mediaItemId: string, subtitles: StoredSubtitleItem[]) {
    subtitles = uniqWith(subtitles, ({ hash: hash1, source: source1 }, { hash: hash2, source: source2 }) => hash1 === hash2 && isEqual(source1, source2));
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
        ...this.generateDefaultPreference(playlistId, mediaItemId),
        list: subtitles,
      });
    } else {
      return objectStore.put({
        ...preference,
        list: unionWith(subtitles, preference.list, isEqual),
      }, key);
    }
  }
  async removeSubtitleItemsFromList(playlistId: number, mediaItemId: string, subtitles: StoredSubtitleItem[]) {
    subtitles = uniqWith(subtitles, ({ hash: hash1, source: source1 }, { hash: hash2, source: source2 }) => hash1 === hash2 && isEqual(source1, source2));
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
      return objectStore.add(this.generateDefaultPreference(playlistId, mediaItemId));
    } else {
      const { list: existedList } = preference;
      remove(existedList, sub => some(subtitles, sub));
      return objectStore.put({
        ...preference,
        list: existedList,
      }, key);
    }
  }
  async retrieveSubtitleLanguage(playlistId: number, mediaItemId: string) {
    const preference = await this.retrieveSubtitlePreference(playlistId, mediaItemId);
    return preference ? preference.language : {
      primary: LanguageCode.Default,
      secondary: LanguageCode.Default,
    };
  }
  async storeSubtitleLanguage(playlistId: number, mediaItemId: string, languageCodes: LanguageCode[]) {
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
        ...this.generateDefaultPreference(playlistId, mediaItemId),
        language: {
          primary: languageCodes[0],
          secondary: languageCodes[1],
        },
      });
    } else {
      return objectStore.put({
        ...preference,
        language: {
          primary: languageCodes[0],
          secondary: languageCodes[1],
        },
      }, key);
    }
  }
  async retrieveSelectedSubtitles(playlistId: number, mediaItemId: string) {
    const preference = await this.retrieveSubtitlePreference(playlistId, mediaItemId);
    return preference ? preference.selected : [];
  }
  async storeSelectedSubtitles(playlistId: number, mediaItemId: string, subtitles: SelectedSubtitle[]) {
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
        ...this.generateDefaultPreference(playlistId, mediaItemId),
        selected: {
          primary: subtitles[0],
          secondary: subtitles[1],
        },
      });
    } else {
      return objectStore.put({
        ...preference,
        selected: {
          primary: subtitles[0],
          secondary: subtitles[1],
        },
      }, key);
    }
  }
  async deleteSubtitlesByPlaylistId(playlistId: number) {
    const playlistStore = await (await this.getDb())
      .transaction('preferences', 'readwrite')
      .objectStore('preferences');
    let cursor = await playlistStore.openCursor();
    while (cursor) {
      if (cursor.value.playlistId === playlistId) await playlistStore.delete(cursor.key);
      cursor = await cursor.continue();
    }
  }
}
