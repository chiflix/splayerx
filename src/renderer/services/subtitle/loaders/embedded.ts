import { cloneDeep } from 'lodash';
import { Type, IEntityGenerator, Format } from '@/interfaces/ISubtitle';
import { LanguageCode } from '@/libs/language';
import { mediaQuickHash } from '@/libs/utils';
import { ISubtitleStream } from '@/plugins/mediaTasks';
import { IEmbeddedOrigin } from '@/interfaces/ISubtitleLoader';

export class EmbeddedGenerator implements IEntityGenerator {
  private origin: IEmbeddedOrigin;

  private language: LanguageCode = LanguageCode.Default;

  public readonly isDefault: boolean;

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
  }

  public async getDisplaySource() { return cloneDeep(this.origin); }

  public async getRealSource() { return cloneDeep(this.origin); }

  public async getFormat() { return Format.AdvancedSubStationAplha; }

  public async getHash() {
    const { videoPath, streamIndex } = this.origin.source;
    return `${await mediaQuickHash.try(videoPath) || ''}-${streamIndex}`;
  }

  public async getLanguage() { return this.language; }

  public async getDelay() { return 0; }
}
