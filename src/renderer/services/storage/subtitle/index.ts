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
  isCachedSubtitle, removeCachedSubtitles,
  addNewSourceToDb,
} from './file';

const db = new SubtitleDataBase();

export async function storeSubtitle(subtitle: Entity) {
  const {
    source, hash, format, language,
  } = subtitle;
  return db.addSubtitle({
    source, format, language, hash,
  });
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
export function retrieveSubtitlePreference(playlistId: number, mediaItemId: string) {
  return db.retrieveSubtitlePreference(playlistId, mediaItemId);
}
export function retrieveStoredSubtitleList(playlistId: number, mediaItemId: string) {
  return db.retrieveSubtitleList(playlistId, mediaItemId);
}
export function addSubtitleItemsToList(
  subtitles: SubtitleControlListItem[],
  playlistId: number,
  mediaItemId: string,
) {
  const storedSubtitles = subtitles.filter(s => s).map(({
    hash, type, source, delay,
  }) => ({
    hash, type, source, delay,
  }));
  return db.addSubtitleItemsToList(playlistId, mediaItemId, storedSubtitles);
}
export function updateSubtitleList(
  subtitles: SubtitleControlListItem[],
  playlistId: number,
  mediaItemId: string,
) {
  const subtitlesToUpdate = subtitles
    .filter(sub => !!sub)
    .map(({
      hash, type, source, delay,
    }) => ({
      hash, type, source, delay,
    }));
  return db.updateSubtitleList(playlistId, mediaItemId, subtitlesToUpdate);
}
export function removeSubtitleItemsFromList(
  subtitles: SubtitleControlListItem[],
  playlistId: number,
  mediaItemId: string,
) {
  const storedSubtitles = subtitles.filter(s => s).map(({
    hash, type, source, delay,
  }) => ({
    hash, type, source, delay,
  }));
  return db.removeSubtitleItemsFromList(playlistId, mediaItemId, storedSubtitles);
}
export function storeSubtitleLanguage(
  languageCodes: LanguageCode[],
  playlistId: number,
  mediaItemId: string,
) {
  return db.storeSubtitleLanguage(playlistId, mediaItemId, languageCodes);
}
export function storeSelectedSubtitles(
  subs: SelectedSubtitle[],
  playlistId: number,
  mediaItemId: string,
) {
  return db.storeSelectedSubtitles(playlistId, mediaItemId, subs);
}
export function retrieveSelectedSubtitles(playlistId: number, mediaItemId: string) {
  return db.retrieveSelectedSubtitles(playlistId, mediaItemId);
}
export async function deleteSubtitlesByPlaylistId(playlistId: number) {
  const hashes = await db.deleteSubtitlesByPlaylistId(playlistId);
  const cachedSubtitleSources = await removeCachedSubtitles(hashes);
  await db.removeSubtitles(cachedSubtitleSources
    .map(({ hash, source }) => ({ hash, source: source.source })));
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
