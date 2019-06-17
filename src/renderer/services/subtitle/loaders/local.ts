import { IOriginSubtitle, SubtitleType } from './index';
import { SubtitleFormat, AssSubtitle, SrtSubtitle, VttSubtitle } from '../parsers';
import { extname, basename } from 'path';
import { LanguageCode } from '@/libs/language';
import { localLanguageCodeLoader, loadLocalFile } from '../utils';

export class LocalSubtitle implements IOriginSubtitle {
  origin: string;
  format: SubtitleFormat;
  constructor(subtitlePath: string) {
    this.origin = subtitlePath;
    this.format = SubtitleFormat[extname(subtitlePath).slice(1)];
  }

  type: SubtitleType.Local;

  language?: LanguageCode;
  async computeLang() {
    return localLanguageCodeLoader(this.origin, this.format);
  }

  private name: string;
  async computeName() {
    if (!this.name) return this.name = basename(this.origin, SubtitleFormat[this.format]);
    return this.name;
  }

  async load() {
    const subtitlePayload = await loadLocalFile(this.origin);
    switch (this.format) {
      case SubtitleFormat.AdvancedSubStationAplha:
      case SubtitleFormat.SubStationAlpha:
        return new AssSubtitle(subtitlePayload);
      case SubtitleFormat.SubRip:
        return new SrtSubtitle(subtitlePayload);
      case SubtitleFormat.WebVTT:
        return new VttSubtitle(subtitlePayload);
    }
  }
}
