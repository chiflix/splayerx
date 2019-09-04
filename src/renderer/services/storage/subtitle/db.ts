import { DBSchema, IDBPDatabase, openDB } from 'idb';
import {
  unionWith, uniqWith, remove, isEqual, some, pick, keyBy, mergeWith, isFinite,
} from 'lodash';
import { LanguageCode } from '@/libs/language';
import { DATADB_NAME } from '@/constants';
import {
  Type, Format, IOrigin, IRawVideoSegment,
} from '@/interfaces/ISubtitle';
import {
  IStoredSubtitle, IStoredSubtitleItem, ISubtitlePreference, SelectedSubtitle, IPrimarySecondary,
} from '@/interfaces/ISubtitleStorage';

interface IDataDBV3 extends DBSchema {
  'subtitles': {
    key: string;
    value: IStoredSubtitle;
  };
  'preferences': {
    key: number;
    value: ISubtitlePreference;
    indexes: {
      'byPlaylist': number,
      'byMediaItem': string,
    },
  };
}
interface IDataDBV4 extends DBSchema {
  'subtitles': {
    key: string;
    value: {
      hash: string;
      source: IOrigin[];
      format: Format;
      language: LanguageCode;
    };
  };
  'subtitle-preferences': {
    key: string;
    value: {
      mediaHash: string;
      list: {
        hash: string;
        type: Type;
        source: unknown;
        videoSegments?: IRawVideoSegment[];
        delay: number;
      }[];
      language: IPrimarySecondary<LanguageCode>;
      selected: IPrimarySecondary<SelectedSubtitle>;
    };
  };
}
interface IDataDBV5 extends DBSchema {
  'subtitles': {
    key: string;
    value: IStoredSubtitle;
  };
  'subtitle-preferences': {
    key: string;
    value: ISubtitlePreference;
  };
}

interface IAddSubtitleOptions {
  hash: string;
  source: IOrigin;
  format: Format;
  language: LanguageCode;
}
interface IRemoveSubtitleOptions {
  hash: string;
  source: IOrigin;
}
interface IUpdateSubtitleOptions {
  hash: string;
  source?: IOrigin;
  format?: Format;
  language?: LanguageCode;
}
interface IUpdateSubtitleItemOptions {
  hash: string;
  source?: IOrigin;
  videoSegments?: IRawVideoSegment[];
  delay?: number;
}

export class SubtitleDataBase {
  private db: IDBPDatabase<IDataDBV5>;

  private async getDb() {
    if (!this.db) {
      this.db = await openDB<IDataDBV5>(
        DATADB_NAME,
        5,
        {
          async upgrade(db, version) {
            if (version > 0 && version < 3) {
              db.deleteObjectStore('subtitles');
              db.createObjectStore('subtitles', { keyPath: 'hash' });
            } else if (version === 3) {
              const v3Db = db as unknown as IDBPDatabase<IDataDBV3>;
              v3Db.deleteObjectStore('subtitles');
              v3Db.deleteObjectStore('preferences');
            } else if (version === 4) {
              const v4Db = db as unknown as IDBPDatabase<IDataDBV4>;
              v4Db.deleteObjectStore('subtitles');
              v4Db.deleteObjectStore('subtitle-preferences');
            }
            db.createObjectStore('subtitles', { keyPath: 'hash' });
            db.createObjectStore('subtitle-preferences', { keyPath: 'mediaHash' });
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

  public async addSubtitle(subtitle: IAddSubtitleOptions) {
    const objectStore = (await this.getDb())
      .transaction('subtitles', 'readwrite')
      .objectStore('subtitles');
    const storedSubtitle = await objectStore.get(subtitle.hash);
    if (!storedSubtitle) {
      return objectStore.add({
        ...subtitle,
        sources: [subtitle.source],
      });
    }
    return objectStore.put({
      ...subtitle,
      sources: uniqWith(storedSubtitle.sources.concat(subtitle.source), isEqual),
    });
  }

  public async removeSubtitle(subtitle: IRemoveSubtitleOptions) {
    const objectStore = (await this.getDb())
      .transaction('subtitles', 'readwrite')
      .objectStore('subtitles');
    const storedSubtitle = await objectStore.get(subtitle.hash);
    if (storedSubtitle) {
      remove(storedSubtitle.sources, storedSource => isEqual(storedSource, subtitle.source));
      if (!storedSubtitle.sources.length) {
        return objectStore.delete(subtitle.hash);
      }
      return objectStore.put({ ...storedSubtitle });
    }
    return undefined;
  }

  public async removeSubtitles(subtitles: IRemoveSubtitleOptions[]) {
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
      const { hash, sources: storedSources } = cursor.value;
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

  public async updateSubtitle(subtitle: IUpdateSubtitleOptions) {
    const objectStore = await (await this.getDb())
      .transaction('subtitles', 'readwrite')
      .objectStore('subtitles');
    const { source, format, language } = subtitle;
    const oldSubtitle = await objectStore.get(subtitle.hash);
    if (oldSubtitle) {
      const newSubtitle = { ...oldSubtitle };
      if (source) newSubtitle.sources = unionWith(oldSubtitle.sources.concat([source]), isEqual);
      if (format) newSubtitle.format = format;
      if (language) newSubtitle.language = language;
      return objectStore.put(newSubtitle);
    }
    if (source && format && language) {
      return this.addSubtitle(subtitle as IAddSubtitleOptions);
    }
    return undefined;
  }

  public async retrieveSubtitlePreference(mediaHash: string) {
    return (await this.getDb()).get('subtitle-preferences', mediaHash);
  }

  private static generateDefaultPreference(mediaHash: string): ISubtitlePreference {
    return {
      mediaHash,
      list: [],
      language: {},
      selected: {},
    };
  }

  public async retrieveSubtitleList(mediaHash: string) {
    const preference = await this.retrieveSubtitlePreference(mediaHash);
    return preference ? preference.list : [];
  }

  private static unionSubtitleList(
    subtitles: IStoredSubtitleItem[],
    subtitlesToUnion: IStoredSubtitleItem[],
  ) {
    return unionWith(
      subtitles, subtitlesToUnion,
      (subtitle, newSubtitle) => isEqual(
        pick(subtitle, ['hash', 'type', 'source']),
        pick(newSubtitle, ['hash', 'type', 'source']),
      ),
    );
  }

  private static uniqSubtitleList(subtitles: IStoredSubtitleItem[]) {
    return uniqWith(
      subtitles,
      (subtitle, newSubtitle) => isEqual(
        pick(subtitle, ['hash', 'type', 'source']),
        pick(newSubtitle, ['hash', 'type', 'source']),
      ),
    );
  }

  public async addSubtitleItemsToList(
    mediaHash: string,
    subtitles: IStoredSubtitleItem[],
  ) {
    subtitles = SubtitleDataBase.uniqSubtitleList(subtitles);
    const objectStore = (await this.getDb())
      .transaction('subtitle-preferences', 'readwrite')
      .objectStore('subtitle-preferences');
    const preference = await objectStore.get(mediaHash);
    if (!preference) {
      return objectStore.add({
        ...SubtitleDataBase.generateDefaultPreference(mediaHash),
        list: subtitles,
      });
    }
    return objectStore.put({
      ...preference,
      list: SubtitleDataBase.unionSubtitleList(preference.list, subtitles),
    });
  }

  public async updateSubtitleList(
    mediaHash: string,
    subtitlesToUpdate: IUpdateSubtitleItemOptions[],
  ) {
    subtitlesToUpdate = uniqWith(subtitlesToUpdate, (
      { hash: hash1, source: source1 },
      { hash: hash2, source: source2 },
    ) => hash1 === hash2 && isEqual(source1, source2));
    const objectStore = (await this.getDb())
      .transaction('subtitle-preferences', 'readwrite')
      .objectStore('subtitle-preferences');
    const preference = await objectStore.get(mediaHash);
    if (!preference) {
      return objectStore.add(SubtitleDataBase.generateDefaultPreference(mediaHash));
    }
    return objectStore.put({
      ...preference,
      list: Object.values(mergeWith(
        keyBy(preference.list, ({ hash }) => hash),
        keyBy(subtitlesToUpdate, ({ hash }) => hash),
        (objVal: IStoredSubtitleItem, srcVal: IStoredSubtitleItem) => {
          const destObj = { ...objVal };
          const { source, videoSegments, delay } = srcVal;
          if (source) destObj.source = source;
          if (videoSegments) destObj.videoSegments = videoSegments;
          if (isFinite(delay)) destObj.delay = delay;
          return destObj;
        },
      )),
    });
  }

  public async removeSubtitleItemsFromList(
    mediaHash: string,
    subtitles: IStoredSubtitleItem[],
  ) {
    subtitles = SubtitleDataBase.uniqSubtitleList(subtitles);
    const objectStore = (await this.getDb())
      .transaction('subtitle-preferences', 'readwrite')
      .objectStore('subtitle-preferences');
    const preference = await objectStore.get(mediaHash);
    if (!preference) {
      return objectStore.add(SubtitleDataBase.generateDefaultPreference(mediaHash));
    }
    const { list: existedList } = preference;
    remove(existedList, sub => some(subtitles, sub));
    return objectStore.put({
      ...preference,
      list: existedList,
    });
  }

  public async retrieveSubtitleLanguage(mediaHash: string) {
    const preference = await this.retrieveSubtitlePreference(mediaHash);
    return preference ? preference.language : {
      primary: LanguageCode.Default,
      secondary: LanguageCode.Default,
    };
  }

  public async storeSubtitleLanguage(
    mediaHash: string,
    languageCodes: LanguageCode[],
  ) {
    const objectStore = (await this.getDb())
      .transaction('subtitle-preferences', 'readwrite')
      .objectStore('subtitle-preferences');
    const preference = await objectStore.get(mediaHash);
    if (!preference) {
      return objectStore.add({
        ...SubtitleDataBase.generateDefaultPreference(mediaHash),
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
    });
  }

  public async retrieveSelectedSubtitles(mediaHash: string) {
    const preference = await this.retrieveSubtitlePreference(mediaHash);
    return preference ? preference.selected : [];
  }

  public async storeSelectedSubtitles(
    mediaHash: string,
    subtitles: SelectedSubtitle[],
  ) {
    const objectStore = (await this.getDb())
      .transaction('subtitle-preferences', 'readwrite')
      .objectStore('subtitle-preferences');
    const preference = await objectStore.get(mediaHash);
    if (!preference) {
      return objectStore.add({
        ...SubtitleDataBase.generateDefaultPreference(mediaHash),
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
    });
  }
}
