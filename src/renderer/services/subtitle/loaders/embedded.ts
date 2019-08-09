import { cloneDeep } from 'lodash';
import {
  IOrigin, Type, IEntityGenerator, Format,
} from '@/interfaces/ISubtitle';
import { LanguageCode } from '@/libs/language';
import { mediaQuickHash } from '@/libs/utils';
import { inferLanguageFromPath, loadLocalFile } from '../utils';
import { ISubtitleStream, getSubtitlePath } from '@/plugins/mediaTasks';

/**
 * Get extracted embedded subtitles's local src
 *
 * @param {string} videoSrc - path of the video file
 * @param {number} subtitleStreamIndex - the number of the subtitle stream index
 * @param {string} subtitleCodec - the codec of the embedded subtitle
 * @returns the subtitle path string
 */
export { getSubtitlePath as embeddedSrcLoader } from '@/plugins/mediaTasks';

export interface IEmbeddedOrigin extends IOrigin {
  type: Type.Embedded,
  source: {
    streamIndex: number;
    videoSrc: string;
    extractedSrc: string;
  };
}

export class EmbeddedGenerator implements IEntityGenerator {
  private origin: IEmbeddedOrigin;

  private format: Format;

  private language: LanguageCode = LanguageCode.Default;

  public readonly isDefault: boolean;

  public constructor(videoSrc: string, stream: ISubtitleStream) {
    this.origin = {
      type: Type.Embedded,
      source: {
        videoSrc,
        streamIndex: stream.index,
        extractedSrc: '',
      },
    };
    this.format = stream.codecName ? stream.codecName as Format : Format.Unknown;
    this.language = stream.tags && stream.tags.language ? stream.tags.language : LanguageCode.No;
    this.isDefault = !!(stream.disposition && stream.disposition.default);
  }

  public async getSource() { return cloneDeep(this.origin); }

  private type = Type.Embedded;

  public async getType() { return this.type; }

  public async getFormat() { return this.format; }

  private async getExtractedSrc() {
    const { videoSrc, streamIndex, extractedSrc } = this.origin.source;
    if (!extractedSrc) {
      this.origin.source.extractedSrc = await getSubtitlePath(videoSrc, streamIndex, this.format);
      return this.origin.source.extractedSrc;
    }
    return extractedSrc;
  }

  public async getHash() {
    return (await mediaQuickHash.try(await this.getExtractedSrc())) || `mediahashfallback-${Math.random()}`;
  }

  public async getLanguage() {
    if (this.language !== LanguageCode.Default) return this.language;
    const { videoSrc, streamIndex, extractedSrc } = this.origin.source;
    if (!extractedSrc) {
      this.origin.source.extractedSrc = await getSubtitlePath(videoSrc, streamIndex, this.format);
    }
    this.language = await inferLanguageFromPath(this.origin.source.extractedSrc);
    return this.language;
  }

  private payload: string;

  public async getPayload() {
    if (!this.payload) this.payload = await loadLocalFile(await this.getExtractedSrc());
    return this.payload;
  }
}
