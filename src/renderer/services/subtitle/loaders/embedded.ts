import { ipcRenderer, Event } from 'electron';
import { cloneDeep } from 'lodash';
import {
  IOrigin, Type, IEntityGenerator, Format,
} from '@/interfaces/ISubtitle';
import { LanguageCode, normalizeCode } from '@/libs/language';
import { mediaQuickHash } from '@/libs/utils';
import { inferLanguageFromPath, loadLocalFile } from '../utils';

interface IExtractSubtitleRequest {
  videoSrc: string;
  streamIndex: number;
  format: Format;
  mediaHash: string;
}
interface IExtractSubtitleResponse {
  error: number;
  index: number;
  path: string;
}

/**
 * Get extracted embedded subtitles's local src
 *
 * @param {string} videoSrc - path of the video file
 * @param {number} subtitleStreamIndex - the number of the subtitle stream index
 * @param {string} subtitleCodec - the codec of the embedded subtitle
 * @returns the subtitle path string
 */
export async function embeddedSrcLoader(
  videoSrc: string,
  streamIndex: number,
  format: Format,
): Promise<string> {
  const mediaHash = await mediaQuickHash.try(videoSrc);
  if (!mediaHash) return Promise.reject(new Error('Cannot get mediaQuickHash for embeddedSrcLoader'));
  ipcRenderer.send('extract-subtitle-request',
    videoSrc,
    streamIndex,
    format,
    mediaHash);
  return new Promise((resolve, reject) => {
    ipcRenderer.once(`extract-subtitle-response-${streamIndex}`, (event: Event, response: IExtractSubtitleResponse) => {
      const { error, index, path } = response;
      if (error) reject(new Error(`${videoSrc}'s No.${index} extraction failed with ${error}.`));
      resolve(path);
    });
  });
}

export interface IEmbeddedOrigin extends IOrigin {
  type: Type.Embedded,
  source: {
    streamIndex: number;
    videoSrc: string;
    extractedSrc: string;
  };
}
export interface ISubtitleStream {
  // eslint-disable-next-line camelcase
  codec_type: string;
  // eslint-disable-next-line camelcase
  codec_name: string;
  index: number;
  tags: {
    language?: string;
    title?: string;
  };
  disposition: {
    default: 0 | 1;
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
    this.format = stream.codec_name as Format;
    this.language = normalizeCode(stream.tags.language || '');
    this.isDefault = !!stream.disposition.default;
  }

  public async getSource() { return cloneDeep(this.origin); }

  private type = Type.Embedded;

  public async getType() { return this.type; }

  public async getFormat() { return this.format; }

  private async getExtractedSrc() {
    const { videoSrc, streamIndex, extractedSrc } = this.origin.source;
    if (!extractedSrc) {
      this.origin.source.extractedSrc = await embeddedSrcLoader(videoSrc, streamIndex, this.format);
      return this.origin.source.extractedSrc;
    }
    return extractedSrc;
  }

  public async getHash() {
    return mediaQuickHash(await this.getExtractedSrc());
  }

  public async getLanguage() {
    if (this.language !== LanguageCode.Default) return this.language;
    const { videoSrc, streamIndex, extractedSrc } = this.origin.source;
    if (!extractedSrc) {
      this.origin.source.extractedSrc = await embeddedSrcLoader(videoSrc, streamIndex, this.format);
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
