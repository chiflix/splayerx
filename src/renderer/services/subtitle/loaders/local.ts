import { IOriginSubtitle, SubtitleType } from './index';
import { SubtitleFormat, AssSubtitle, SrtSubtitle, VttSubtitle } from '../parsers';
import { extname, basename } from 'path';
import { LanguageCode } from '@/libs/language';
import { extractTextFragment, loadLocalFile } from '../utils';
import { assFragmentLanguageLoader, srtFragmentLanguageLoader, vttFragmentLanguageLoader } from '../language';

function pathToFormat(path: string): SubtitleFormat | undefined {
  const extension = extname(path).slice(1);
  switch (extension) {
    case 'ass':
      return SubtitleFormat.AdvancedSubStationAplha;
    case 'srt':
      return SubtitleFormat.SubRip;
    case 'sub':
      return SubtitleFormat.SubStationAlpha;
    case 'vtt':
      return SubtitleFormat.WebVTT;
  }
}

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
    return localLanguageCodeLoader(this.origin, this.format);
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
