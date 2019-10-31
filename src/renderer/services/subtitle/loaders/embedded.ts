import { cloneDeep } from 'lodash';
import { Type, IEntityGenerator, Format } from '@/interfaces/ISubtitle';
import { LanguageCode } from '@/libs/language';
import { mediaQuickHash } from '@/libs/utils';
import { ISubtitleStream } from '@/plugins/mediaTasks';
import { IEmbeddedOrigin } from '../utils/loaders';

export class EmbeddedGenerator implements IEntityGenerator {
  private origin: IEmbeddedOrigin;

  private language: LanguageCode = LanguageCode.Default;

  public readonly isDefault: boolean;

  private readonly format: Format;

  private getFinalFormat(stream: ISubtitleStream) {
    switch (stream.codecName) {
      case 'ass':
      case 'subrip':
      case 'ssa':
      case 'webvtt':
        return Format.AdvancedSubStationAplha;
      case 'dvb_subtitle':
      case 'hdmv_pgs_subtitle':
      case 'dvd_subtitle':
        return Format.SagiImage;
      default:
        throw new Error(`Unknown subtitle codec name: ${stream.codecName}.`);
    }
  }

  public constructor(videoPath: string, stream: ISubtitleStream) {
    this.origin = {
      type: Type.Embedded,
      source: {
        videoPath,
        streamIndex: stream.index,
      },
    };
    this.language = stream.tags && stream.tags.language ? stream.tags.language : LanguageCode.No;
    this.isDefault = !!(stream.disposition && stream.disposition.default);
    this.format = this.getFinalFormat(stream);
  }

  public async getDisplaySource() { return cloneDeep(this.origin); }

  public async getRealSource() { return cloneDeep(this.origin); }

  public async getFormat() { return this.format; }

  public async getHash() {
    const { videoPath, streamIndex } = this.origin.source;
    return `${await mediaQuickHash.try(videoPath) || ''}-${streamIndex}`;
  }

  public async getLanguage() { return this.language; }

  public async getDelay() { return 0; }
}
