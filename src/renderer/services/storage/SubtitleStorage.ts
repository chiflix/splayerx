import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { LanguageCode, normalizeCode } from '@/libs/language';
import { RECENT_OBJECT_STORE_NAME, VIDEO_OBJECT_STORE_NAME, DATADB_NAME, INFO_DATABASE_NAME, INFODB_VERSION } from '@/constants';
import { MediaItem, PlaylistItem, SubtitlePreference as oldPreference } from '@/interfaces/IDB';
import { Entity, EntityGenerator, Type, Format, Origin, SubtitleControlListItem } from '@/interfaces/ISubtitle';
import { StoredSubtitle, StoredSubtitleItem, SubtitlePreference, SelectedSubtitle } from '@/interfaces/ISubtitleStorage';
import { uniqBy, unionWith, uniqWith, remove, isEqual, get, zip, union, flatMap, some } from 'lodash';
import Sagi from '@/libs/sagi';
import { loadLocalFile, pathToFormat } from '../subtitle/utils';
import { embeddedSrcLoader } from '../subtitle/loaders/embedded';
import helpers from '@/helpers';

interface DataDBV1 extends DBSchema {
  'subtitles': {
    key: number;
    value: {
      type: Type;
      src: string;
      format: string;
      language: string;
    };
    indexes: {
      type: string;
      format: string;
      src: number | string;
      language: string;
      lastOpened: Date;
    };
  };
}
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
interface InfoDBV3 extends DBSchema {
  [RECENT_OBJECT_STORE_NAME]: {
    key: number;
    value: PlaylistItem;
    indexes: {
      lastOpened: number;
      hpaths: string[];
    };
  };
  [VIDEO_OBJECT_STORE_NAME]: {
    key: number;
    value: MediaItem;
    indexes: {
      path: string;
      lastPlayedTime: number;
      source: string;
    };
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

async function v1PlaylistToV2Preference(): Promise<{
  preference: SubtitlePreference[],
  subtitle: number[],
}> {
  const infoDb = await openDB<InfoDBV3>(INFO_DATABASE_NAME, INFODB_VERSION);
  const preferenceList: SubtitlePreference[] = [];
  let subtitleIdList: number[] = [];
  let cursor = await infoDb.transaction('recent-played', 'readonly').objectStore('recent-played').openCursor();
  const mediaStore = await infoDb.transaction('media-item', 'readonly').objectStore('media-item');
  while (cursor) {
    const playlistId = cursor.key;
    const { hpaths, items } = cursor.value;
    const mediaItems = zip(hpaths, items)
      .filter(mediaItem => !mediaItem[0] || !mediaItem[1]) as [string, number][]
    const oldPreferenceList = (await Promise.all(
      mediaItems.map(async (mediaItem) => [
        mediaItem[0],
        await mediaStore.get(mediaItem[1]).catch(err => new Error()),
      ])
    ))
      .filter(mediaItem => get(mediaItem[1], 'preference.subtitle'))
      .map(mediaItem => [mediaItem[0], get(mediaItem[1], 'preference.subtitle')]) as [string, oldPreference][];
    const validPreferenceList = oldPreferenceList.map((p) => ({
      playlistId,
      mediaId: p[0],
      list: p[1].list
        .map(({ id, type }) => ({ hash: id.toString(), type }))
        .filter(({ type }) => type !== 'embedded'),
      language: {
        primary: normalizeCode(p[1].language[0]),
        secondary: normalizeCode(p[1].language[1]),
      },
      selected: {
        primary: p[1].selected.firstId.toString() as unknown as SelectedSubtitle,
        secondary: p[1].selected.secondaryId.toString() as unknown as SelectedSubtitle,
      },
    })) as SubtitlePreference[]
    const validSubtitleIdList = flatMap(oldPreferenceList
      .map((p) => p[1].list
        .map(({ id }) => id)
        .concat([p[1].selected.firstId, p[1].selected.secondaryId])));
    preferenceList.concat(validPreferenceList);
    subtitleIdList = union(subtitleIdList, validSubtitleIdList);

    cursor.continue();
  }
  return {
    preference: preferenceList,
    subtitle: subtitleIdList,
  };
}

async function v1SubtitlesToV2Subtitles(v1Ids: number[]): Promise<{
  subtitle: StoredSubtitle[],
  map: { [v1Id: string]: string },
}> {
  const store = (await openDB<DataDBV1>(DATADB_NAME, 1)).transaction('subtitles').objectStore('subtitles');
  const resultEntries: [string, StoredSubtitle][] = (await Promise.all(
    v1Ids.map(async (id): Promise<[string, StoredSubtitle] | [string, undefined]> => {
      const v1Subtitle = await store.get(id);
      let v2Subtitle: StoredSubtitle;
      if (v1Subtitle && v1Subtitle.type !== Type.Embedded) {
        const { type, src, language } = v1Subtitle;
        const v2Subtitle =  type === Type.Online ? {
          source: [{ type, source: src }],
          format: Format.Sagi,
          language: normalizeCode(language),
          hash: src,
        } : {
          source: [{ type, source: src }],
          format: pathToFormat(src),
          language: normalizeCode(language),
          hash: await helpers.methods.mediaQuickHash(src),
        };
        return [id.toString(), v2Subtitle];
      }
      return [id.toString(), undefined];
    })
  )).filter(subtitle => !!subtitle) as [string, StoredSubtitle][];

  return {
    subtitle: resultEntries.map(entry => entry[1]),
    map: Object.fromEntries([
      resultEntries.map(entry => entry[0]),
      resultEntries.map(entry => entry[1].hash),
    ]),
  };
}

class SubtitleDataBase {
  private db: IDBPDatabase<DataDBV2>;
  private async getDb() {
    return this.db ? this.db : this.db = await openDB<DataDBV2>(
      DATADB_NAME,
      2,
      {
        async upgrade(db, version) {
          if (version < 1) {
            db.createObjectStore('subtitles', { keyPath: 'hash' });
            const preferenceStore = db.createObjectStore('preferences', { autoIncrement: true });
            preferenceStore.createIndex('byPlaylist', 'playlistId');
            preferenceStore.createIndex('byMediaItem', 'mediaId');
          } else if (version < 2) {
            // retrieve all needed info
            const { preference, subtitle: v1Ids } = await v1PlaylistToV2Preference();
            const { subtitle, map } = await v1SubtitlesToV2Subtitles(v1Ids);
            const preferencesWithV2Id = preference.map(p => ({
              ...p,
              list: p.list.map(s => ({ ...s, hash: map[s.hash] })),
              selected: {
                primary: { hash: map[p.selected.primary as unknown as string] },
                secondary: { hash: map[p.selected.secondary as unknown as string] },
              },
            }));
            // arrange the object stores
            db.deleteObjectStore('subtitles');
            db.createObjectStore('subtitles', { keyPath: 'hash' });
            const preferenceStore = db.createObjectStore('preferences', { autoIncrement: true });
            preferenceStore.createIndex('byPlaylist', 'playlistId');
            preferenceStore.createIndex('byMediaItem', 'mediaId');
            // add the info into new stores
            const subtitleTransaction = db.transaction('subtitles', 'readwrite').objectStore('subtitles');
            const preferenceTransaction = db.transaction('preferences', 'readwrite').objectStore('preferences');
            Promise.all([
              Promise.all(subtitle.map(sub => subtitleTransaction.put(sub))),
              Promise.all(preferencesWithV2Id.map(preference => preferenceTransaction.put(preference))),
            ]);
          }
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
    subtitles = uniqBy(subtitles, 'source');
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
    subtitles = uniqBy(subtitles, 'source');
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

const db = new SubtitleDataBase();

export class DatabaseGenerator implements EntityGenerator {
  private constructor() {}
  private type: Type;
  async getType() { return this.type; }
  private format: Format;
  async getFormat() { return this.format; }
  private language: LanguageCode = LanguageCode.Default;
  async getLanguage() { return this.language; }
  private sources: Origin[];
  async getSource() { return this.sources[0]; }
  private storedSource: Origin;
  async getStoredSource() { return this.storedSource; }
  async getPayload() {
    const { type, source } = await this.getSource();
    switch (type) {
      case Type.Embedded:
        const embeddedSrc = await embeddedSrcLoader(
          source.videoSrc as string,
          source.streamIndex as number,
          this.format,
        );
        return loadLocalFile(embeddedSrc);
      case Type.Local:
        return loadLocalFile(source);
      case Type.Online:
        return Sagi.getTranscript({ transcriptIdentity: source, startTime: 0 });
    }
  }
  private hash: string;
  async getHash() {
    return this.hash;
  }
  static async from(storedSubtitleItem: StoredSubtitleItem) {
    const { hash, type } = storedSubtitleItem;
    const storedSubtitle = await db.retrieveSubtitle(hash);
    if (storedSubtitle) {
      const newGenerator = new DatabaseGenerator();
      newGenerator.storedSource = {
        type,
        source: storedSubtitleItem.source,
      };
      const { source, format, language } = storedSubtitle;
      newGenerator.type = type;
      newGenerator.format = format;
      newGenerator.language = language;
      newGenerator.sources = source;
      newGenerator.hash = hash;
      return newGenerator;
    }
  }
}

export async function storeSubtitle(subtitle: Entity) {
  const { source, hash, format, language } = subtitle;
  return db.addSubtitle({ source, format, language, hash });
}
export async function removeSubtitle(subtitle: Entity) {
  const { hash, source } = subtitle;
  return db.removeSubtitle({ hash, source });
}
export function retrieveSubtitlePreference(playlistId: number, mediaItemId: string) {
  return db.retrieveSubtitlePreference(playlistId, mediaItemId);
}
export function retrieveStoredSubtitleList(playlistId: number, mediaItemId: string) {
  return db.retrieveSubtitleList(playlistId, mediaItemId);
}
export function addSubtitleItemsToList(subtitles: SubtitleControlListItem[], playlistId: number, mediaItemId: string) {
  const storedSubtitles = subtitles.map(({ hash, type, source }) => ({ hash, type, source }));
  return db.addSubtitleItemsToList(playlistId, mediaItemId, storedSubtitles);
}
export function removeSubtitleItemsFromList(subtitles: SubtitleControlListItem[], playlistId: number, mediaItemId: string) {
  const storedSubtitles = subtitles.map(({ hash, type, source }) => ({ hash, type, source }));
  return db.removeSubtitleItemsFromList(playlistId, mediaItemId, storedSubtitles);
}
export function storeSubtitleLanguage(languageCodes: LanguageCode[], playlistId: number, mediaItemId: string) {
  return db.storeSubtitleLanguage(playlistId, mediaItemId, languageCodes);
}
export function storeSelectedSubtitles(subs: SelectedSubtitle[], playlistId: number, mediaItemId: string) {
  return db.storeSelectedSubtitles(playlistId, mediaItemId, subs);
}
export function retrieveSelectedSubtitles(playlistId: number, mediaItemId: string) {
  return db.retrieveSelectedSubtitles(playlistId, mediaItemId);
}
export function deleteSubtitlesByPlaylistId(playlistId: number) {
  return db.deleteSubtitlesByPlaylistId(playlistId);
}
