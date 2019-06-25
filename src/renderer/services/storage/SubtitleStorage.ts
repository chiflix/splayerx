import { DBSchema, IDBPDatabase, openDB, IDBPTransaction } from 'idb';
import { LanguageCode, normalizeCode } from '@/libs/language';
import { RECENT_OBJECT_STORE_NAME, VIDEO_OBJECT_STORE_NAME, DATADB_NAME, INFO_DATABASE_NAME, INFODB_VERSION } from '@/constants';
import { MediaItem, PlaylistItem } from '@/interfaces/IDB';
import { Entity, EntityGenerator, Type, Format, Origin } from '@/interfaces/ISubtitle';
import { StoredSubtitle, StoredSubtitleItem } from '@/interfaces/ISubtitleStorage';
import { uniqBy, unionBy, includes, remove, isEqual, flatMap } from 'lodash';
import Sagi from '@/libs/sagi';
import { loadLocalFile } from '../subtitle/utils';
import { embeddedSrcLoader } from '../subtitle/loaders/embedded';
import helpers from '@/helpers';

interface DataDBV1 extends DBSchema {
  'subtitles': {
    key: number;
    value: {
      type: string;
      src: number | string;
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
    key: string;
    value: {
      hash: string;
      language: [LanguageCode, LanguageCode];
      list: StoredSubtitleItem[];
      selected: string[];
    };
  };
}
interface InfoDBV3 extends DBSchema {
  [RECENT_OBJECT_STORE_NAME]: {
    key: string;
    value: PlaylistItem;
    indexes: {
      lastOpened: number;
      hpaths: string[];
    };
  };
  [VIDEO_OBJECT_STORE_NAME]: {
    key: string;
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

class SubtitleDataBase {
  private db: IDBPDatabase<DataDBV2>;
  private async v1SubtitleTransformer(v1Subtitle: any) {
    const v2Subtitle: StoredSubtitle = {
      language: normalizeCode(v1Subtitle.language),
    } as StoredSubtitle;

    // set format
    if (v1Subtitle.type === 'online') {
      v2Subtitle.format = Format.Sagi;
      v2Subtitle.source = [{
        type: Type.Online,
        source: v1Subtitle.src,
      }];
      v2Subtitle.hash = v1Subtitle.src;
    }
    else {
      v2Subtitle.source = [{
        type: Type.Local,
        source: v1Subtitle.src,
      }];
      v2Subtitle.hash = await helpers.methods.mediaQuickHash(v1Subtitle.src);
      switch (v1Subtitle.format) {
        case 'srt':
          v2Subtitle.format = Format.SubRip;
          break;
        case 'ass':
          v2Subtitle.format = Format.AdvancedSubStationAplha;
          break;
        case 'ssa':
          v2Subtitle.format = Format.SubStationAlpha;
          break;
        case 'vtt':
          v2Subtitle.format = Format.WebVTT;
          break;
      }
    }
    return v2Subtitle;
  }
  private async getDb() {
    return this.db ? this.db : this.db = await openDB<DataDBV2>(DATADB_NAME, 2);
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
    } else if (!includes(storedSubtitle.source, subtitle.source)) {
      return objectStore.put({
        ...subtitle,
        source: storedSubtitle.source.concat([subtitle.source]),
      });
    }
    return objectStore.put({
      ...subtitle,
      ...storedSubtitle,
    });
  }
  async removeSubtitle(subtitle: RemoveSubtitleOptions) {
    const objectStore = (await this.getDb())
      .transaction('subtitles', 'readwrite')
      .objectStore('subtitles');
    const storedSubtitle = await objectStore.get(subtitle.hash);
    if (storedSubtitle && storedSubtitle.source.includes(subtitle.source)) {
      remove(storedSubtitle.source, storedSub => isEqual(storedSub.source, subtitle.source));
      if (!storedSubtitle.source.length) {
        return objectStore.delete(subtitle.hash);
      } else {
        return objectStore.put({ ...storedSubtitle });
      }
    }
  }

  async retrieveSubtitlePreference(hash: string) {
    return (await this.getDb())
      .transaction('preferences', 'readonly')
      .objectStore('preferences')
      .get(hash);
  }
  private generateDefaultPreference(hash: string) {
    return {
      hash,
      language: [LanguageCode.Default, LanguageCode.Default] as [LanguageCode, LanguageCode],
      list: [],
      selected: ['', ''],
    };
  }
  async retrieveSubtitleList(hash: string) {
    const preference =  await this.retrieveSubtitlePreference(hash);
    return preference ? preference.list : [];
  }
  async addSubtitleItemsToList(hash: string, subtitles: StoredSubtitleItem[]) {
    subtitles = uniqBy(subtitles, 'hash');
    const objectStore = (await this.getDb())
      .transaction('preferences', 'readwrite')
      .objectStore('preferences');
    const preference = await objectStore.get(hash);
    if (!preference) {
      return objectStore.add({
        ...this.generateDefaultPreference(hash),
        list: subtitles,
      });
    } else {
      return objectStore.put({
        ...preference,
        list: unionBy(subtitles, preference.list, 'hash'),
      });
    }
  }
  async removeSubtitleItemsFromList(hash: string, subtitles: StoredSubtitleItem[]) {
    subtitles = uniqBy(subtitles, 'hash');
    const objectStore = (await this.getDb())
      .transaction('preferences', 'readwrite')
      .objectStore('preferences');
    const preference = await objectStore.get(hash);
    if (!preference) {
      return objectStore.add(this.generateDefaultPreference(hash));
    } else {
      const { list: existedList } = preference;
      remove(existedList, (sub: StoredSubtitleItem) => subtitles.includes(sub));
      return objectStore.put({
        ...preference,
        list: existedList,
      });
    }
  }
  async retrieveSubtitleLanguage(hash: string) {
    const preference = await this.retrieveSubtitlePreference(hash);
    return preference ? preference.language : [LanguageCode.Default, LanguageCode.Default];
  }
  async storeSubtitleLanguage(hash: string, languageCodes: LanguageCode[]) {
    const objectStore = (await this.getDb())
      .transaction('preferences', 'readwrite')
      .objectStore('preferences');
    const preference = await objectStore.get(hash);
    if (!preference) {
      return objectStore.add({
        ...this.generateDefaultPreference(hash),
        language: [languageCodes[0], languageCodes[1]],
      });
    } else {
      return objectStore.put({
        ...preference,
        language: [languageCodes[0], languageCodes[1]],
      });
    }
  }
  async retrieveSelectedSubtitleIds(hash: string) {
    const preference = await this.retrieveSubtitlePreference(hash);
    return preference ? preference.selected : [];
  }
  async storeSelectedSubtitleIds(hash: string, subtitleIds: string[]) {
    const objectStore = (await this.getDb())
      .transaction('preferences', 'readwrite')
      .objectStore('preferences');
    const preference = await objectStore.get(hash);
    if (!preference) {
      return objectStore.add({
        ...this.generateDefaultPreference(hash),
        selected: subtitleIds,
      });
    } else {
      return objectStore.put({
        ...preference,
        selected: subtitleIds,
      });
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
      const { source, format, language } = storedSubtitle;
      newGenerator.type = type;
      newGenerator.format = format;
      newGenerator.language = language;
      newGenerator.sources = source;
      newGenerator.hash = hash;
    }
  }
}

export async function storeSubtitle(subtitle: Entity) {
  const { source, hash, format, language } = subtitle;
  await db.addSubtitle({ source, format, language, hash });
}
