import {
  Entity, SubtitleControlListItem, IEntityGenerator, Type, Format, IOrigin,
} from '@/interfaces/ISubtitle';
import { LanguageCode } from '@/libs/language';
import { SelectedSubtitle, IStoredSubtitleItem } from '@/interfaces/ISubtitleStorage';
import { SubtitleDataBase } from './db';

import Sagi from '@/libs/sagi';
import { loadLocalFile } from '@/services/subtitle/utils';
import { embeddedSrcLoader, IEmbeddedOrigin } from '@/services/subtitle/loaders/embedded';
import {
  cacheEmbeddedSubtitle, cacheLocalSubtitle, cacheOnlineSubtitle,
  isCachedSubtitle,
  addNewSourceToDb,
} from './file';

const db = new SubtitleDataBase();

export async function storeSubtitle(subtitle: Entity) {
  const {
    source, hash, format, language,
  } = subtitle;
  if (format !== Format.Unknown) {
    return db.addSubtitle({
      source, format, language, hash,
    });
  }
  return undefined;
}
export async function removeSubtitle(subtitle: Entity) {
  const { hash, source } = subtitle;
  return db.removeSubtitle({ hash, source });
}
export async function updateSubtitle(subtitle: Entity) {
  const {
    hash, source, format, language,
  } = subtitle;
  return db.updateSubtitle({
    hash, source, format, language,
  });
}
export function retrieveSubtitlePreference(mediaHash: string) {
  return db.retrieveSubtitlePreference(mediaHash);
}
export function retrieveStoredSubtitleList(mediaHash: string) {
  return db.retrieveSubtitleList(mediaHash);
}
export function addSubtitleItemsToList(
  subtitles: SubtitleControlListItem[],
  mediaHash: string,
) {
  const storedSubtitles = subtitles.filter(s => s).map(({
    hash, type, source, delay,
  }) => ({
    hash, type, source, delay,
  }));
  return db.addSubtitleItemsToList(mediaHash, storedSubtitles);
}
export function updateSubtitleList(
  subtitles: SubtitleControlListItem[],
  mediaHash: string,
) {
  const subtitlesToUpdate = subtitles
    .filter(sub => !!sub)
    .map(({
      hash, type, source, delay,
    }) => ({
      hash, type, source, delay,
    }));
  return db.updateSubtitleList(mediaHash, subtitlesToUpdate);
}
export function removeSubtitleItemsFromList(
  subtitles: SubtitleControlListItem[],
  mediaHash: string,
) {
  const storedSubtitles = subtitles.filter(s => s).map(({
    hash, type, source, delay,
  }) => ({
    hash, type, source, delay,
  }));
  return db.removeSubtitleItemsFromList(mediaHash, storedSubtitles);
}
export function storeSubtitleLanguage(
  languageCodes: LanguageCode[],
  mediaHash: string,
) {
  return db.storeSubtitleLanguage(mediaHash, languageCodes);
}
export function storeSelectedSubtitles(
  subs: SelectedSubtitle[],
  mediaHash: string,
) {
  return db.storeSelectedSubtitles(mediaHash, subs);
}
export function retrieveSelectedSubtitles(mediaHash: string) {
  return db.retrieveSelectedSubtitles(mediaHash);
}

export class DatabaseGenerator implements IEntityGenerator {
  private type: Type;

  public async getType() { return this.type; }

  private format: Format;

  public async getFormat() { return this.format; }

  private language: LanguageCode = LanguageCode.Default;

  public async getLanguage() { return this.language; }

  private sources: IOrigin[];

  public async getSource() {
    const cachedSubtitle = this.sources.find(isCachedSubtitle);
    if (cachedSubtitle) return cachedSubtitle;
    return this.sources[0];
  }

  private storedSource: IOrigin;

  public async getStoredSource() { return this.storedSource; }

  public async getPayload() {
    const { type, source } = await this.getSource();
    switch (type) {
      case Type.Embedded: {
        const { source } = await this.getSource() as IEmbeddedOrigin;
        const embeddedSrc = await embeddedSrcLoader(
          source.videoSrc,
          source.streamIndex,
          this.format,
        );
        return loadLocalFile(embeddedSrc);
      }
      case Type.Local:
        return loadLocalFile(source as string);
      case Type.Online:
        return Sagi.getTranscript({ transcriptIdentity: source as string, startTime: 0 });
      default:
        throw new Error(`Unexpected subtitle type ${type}.`);
    }
  }

  private hash: string;

  public async getHash() {
    return this.hash;
  }

  private delayInSeconds: number;

  public async getDelay() {
    return this.delayInSeconds;
  }

  public static async from(storedSubtitleItem: IStoredSubtitleItem) {
    const { hash, type, delay } = storedSubtitleItem;
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
      newGenerator.delayInSeconds = delay || 0;
      return newGenerator;
    }
    return undefined;
  }
}

export async function cacheSubtitle(subtitle: Entity) {
  switch (subtitle.type) {
    case Type.Embedded:
      return cacheEmbeddedSubtitle(subtitle)
        .then(source => addNewSourceToDb(subtitle, source));
    case Type.Local:
      return cacheLocalSubtitle(subtitle)
        .then(source => addNewSourceToDb(subtitle, source));
    case Type.Translated:
    case Type.Online: {
      const newOnlineSource = await cacheOnlineSubtitle(subtitle);
      if (newOnlineSource) return addNewSourceToDb(subtitle, newOnlineSource);
      break;
    }
    default:
      throw new Error(`Unexpected subtitle type ${subtitle.type}.`);
  }
  return undefined;
}
