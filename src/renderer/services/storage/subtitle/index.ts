import { Entity, SubtitleControlListItem } from '@/interfaces/ISubtitle';
import { LanguageCode } from '@/libs/language';
import { SelectedSubtitle, StoredSubtitleItem } from '@/interfaces/ISubtitleStorage';
import { SubtitleDataBase } from './db';
import { EntityGenerator, Type, Format, Origin } from '@/interfaces/ISubtitle';
import Sagi from '@/libs/sagi';
import { loadLocalFile } from '@/services/subtitle/utils';
import { embeddedSrcLoader } from '@/services/subtitle/loaders/embedded';

const db = new SubtitleDataBase();

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
  const storedSubtitles = subtitles.filter(s => s).map(({ hash, type, source }) => ({ hash, type, source }));
  return db.addSubtitleItemsToList(playlistId, mediaItemId, storedSubtitles);
}
export function removeSubtitleItemsFromList(subtitles: SubtitleControlListItem[], playlistId: number, mediaItemId: string) {
  const storedSubtitles = subtitles.filter(s => s).map(({ hash, type, source }) => ({ hash, type, source }));
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
