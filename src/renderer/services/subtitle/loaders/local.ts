import { IOriginSubtitle, SubtitleType } from './index';
import { SubtitleFormat, AssSubtitle, SrtSubtitle, VttSubtitle } from '../parsers';
import { extname, basename } from 'path';
import { LanguageCode } from '@/libs/language';
import { pathToFormat, extractTextFragment, loadLocalFile } from '../utils';
import { assFragmentLanguageLoader, srtFragmentLanguageLoader, vttFragmentLanguageLoader } from '../utils';

export class LocalSubtitle implements IOriginSubtitle {
  origin: string;
  format: SubtitleFormat;
  constructor(subtitlePath: string) {
    this.origin = subtitlePath;
    const format = pathToFormat(subtitlePath);
    if (!format) throw new Error(`Unrecongnized subtitle format ${subtitlePath}.`);
    this.format = format;
  }

  type: SubtitleType.Local;

  language?: LanguageCode;
  async computeLang() {
    const textFragment = await extractTextFragment(this.origin);
    switch (this.format) {
      case SubtitleFormat.AdvancedSubStationAplha:
      case SubtitleFormat.SubStationAlpha:
        return assFragmentLanguageLoader(textFragment)[0];
      case SubtitleFormat.SubRip:
        return srtFragmentLanguageLoader(textFragment)[0];
      case SubtitleFormat.WebVTT:
        return vttFragmentLanguageLoader(textFragment)[0];
      default:
        throw new Error(`Unsupported format ${this.format}.`);
    }
  }

  private name: string;
  async computeName() {
    if (!this.name) return this.name = basename(this.origin, extname(this.origin).slice(1));
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
