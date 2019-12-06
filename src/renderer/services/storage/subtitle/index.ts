import { dirname } from 'path';
import {
  IEntity, IEntityGenerator, Type, Format, IOrigin,
} from '@/interfaces/ISubtitle';
import { LanguageCode } from '@/libs/language';
import { SelectedSubtitle, IStoredSubtitleItem } from '@/interfaces/ISubtitleStorage';
import { SubtitleDataBase } from './db';
import { SUBTITLE_FULL_DIRNAME } from '@/constants';
import { sourceToFormat } from '@/services/subtitle/utils';

const db = new SubtitleDataBase();

export async function storeSubtitle(subtitle: IEntity) {
  if (subtitle) {
    const {
      realSource, hash, format, language,
    } = subtitle;
    if (realSource && hash && language && format && format !== Format.Unknown) {
      db.addSubtitle({
        source: realSource, format, language, hash,
      });
    }
  }
}
export async function removeSubtitle(subtitle: IEntity) {
  if (subtitle) {
    const { hash, realSource } = subtitle;
    if (hash && realSource) db.removeSubtitle({ hash, source: realSource });
  }
}
export async function updateSubtitle(subtitle: IEntity) {
  if (subtitle) {
    const {
      hash, realSource, format, language,
    } = subtitle;
    if (realSource && hash && format && language) {
      db.updateSubtitle({
        hash, source: realSource, format, language,
      });
    }
  }
}
export function retrieveSubtitlePreference(mediaHash: string = '') {
  return db.retrieveSubtitlePreference(mediaHash);
}
export function retrieveStoredSubtitleList(mediaHash: string = '') {
  return db.retrieveSubtitleList(mediaHash);
}
export function addSubtitleItemsToList(
  subtitles: IEntity[] = [],
  mediaHash: string = '',
) {
  const storedSubtitles = subtitles
    .filter(s => s && s.hash && s.displaySource)
    .map(({
      hash, displaySource, delay,
    }) => ({
      hash, source: displaySource, delay,
    }));
  return db.addSubtitleItemsToList(mediaHash, storedSubtitles);
}
export function updateSubtitleList(
  subtitles: IEntity[] = [],
  mediaHash: string = '',
) {
  const subtitlesToUpdate = subtitles
    .filter(s => s && s.hash && s.displaySource)
    .map(({
      hash, displaySource, delay,
    }) => ({
      hash, source: displaySource, delay,
    }));
  return db.updateSubtitleList(mediaHash, subtitlesToUpdate);
}
export function removeSubtitleItemsFromList(
  subtitles: IEntity[] = [],
  mediaHash: string = '',
) {
  const storedSubtitles = subtitles
    .filter(s => s && s.hash && s.displaySource)
    .map(({
      hash, displaySource, delay,
    }) => ({
      hash, source: displaySource, delay,
    }));
  return db.removeSubtitleItemsFromList(mediaHash, storedSubtitles);
}
export function storeSubtitleLanguage(
  languageCodes: LanguageCode[] = [LanguageCode.Default, LanguageCode.Default],
  mediaHash: string = '',
) {
  return db.storeSubtitleLanguage(mediaHash, languageCodes);
}
export function storeSelectedSubtitles(
  subs: SelectedSubtitle[] = [],
  mediaHash: string = '',
) {
  return db.storeSelectedSubtitles(mediaHash, subs);
}
export function retrieveSelectedSubtitles(mediaHash: string = '') {
  return db.retrieveSelectedSubtitles(mediaHash);
}

export class DatabaseGenerator implements IEntityGenerator {
  private format: Format;

  public async getFormat() { return this.format; }

  private language: LanguageCode = LanguageCode.Default;

  public async getLanguage() { return this.language; }

  private displaySource: IOrigin;

  public async getDisplaySource() { return this.displaySource; }

  private realSource: IOrigin;

  public async getRealSource() { return this.realSource; }

  private hash: string;

  public async getHash() {
    return this.hash;
  }

  private delayInSeconds: number;

  public async getDelay() {
    return this.delayInSeconds;
  }

  public static async from(storedSubtitleItem: IStoredSubtitleItem) {
    const { hash, source, delay } = storedSubtitleItem;
    const storedSubtitle = await db.retrieveSubtitle(hash);
    if (storedSubtitle) {
      const newGenerator = new DatabaseGenerator();
      newGenerator.displaySource = source;
      const { sources, language } = storedSubtitle;
      newGenerator.realSource = sources
        .find(({ type, source }) => type === Type.Local
          && dirname(source as string) === SUBTITLE_FULL_DIRNAME) || sources[0];
      newGenerator.format = newGenerator.realSource.type === Type.Modified
        ? storedSubtitle.format : sourceToFormat(newGenerator.realSource);
      newGenerator.language = language;
      newGenerator.hash = hash;
      newGenerator.delayInSeconds = delay || 0;
      return newGenerator;
    }
    return undefined;
  }
}
