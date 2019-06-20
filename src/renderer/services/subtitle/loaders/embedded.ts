import { IOriginSubtitle, IEmbeddedSubtitleOrigin, SubtitleType } from './index';
import { SubtitleFormat, AssSubtitle, SrtSubtitle, VttSubtitle } from '../parsers';
import { LanguageCode, normalizeCode } from '@/libs/language';
import { ipcRenderer, Event } from 'electron';
import helpers from '@/helpers';
import { inferLanguageFromPath, loadLocalFile } from '../utils';


interface IExtractSubtitleRequest {
  videoSrc: string;
  streamIndex: number;
  format: SubtitleFormat;
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
async function embeddedSrcLoader(videoSrc: string, streamIndex: number, format: SubtitleFormat): Promise<string> {
  const mediaHash = await helpers.methods.mediaQuickHash(videoSrc);
  ipcRenderer.send('extract-subtitle-request', {
    videoSrc,
    streamIndex,
    format,
    mediaHash,
  } as IExtractSubtitleRequest);
  return new Promise((resolve, reject) => {
    ipcRenderer.once('extract-subtitle-response', (event: Event, response: IExtractSubtitleResponse) => {
      const { error, index, path } = response;
      if (error) reject(new Error(`${videoSrc}'s No.${index} extraction failed with ${error}.`));
      resolve(path);
    });
  });
}

export interface ISubtitleStream {
  codec_type: string;
  codec_name: string;
  index: number;
  tags: {
    language?: string;
    title?: string;
  };
  disposition: {
    default: 0 | 1;
  };
  [propName: string]: any;
}

export class EmbeddedSubtitle implements IOriginSubtitle {
  origin: IEmbeddedSubtitleOrigin;
  format: SubtitleFormat;
  language?: LanguageCode;
  isDefault: boolean;
  name: string;
  constructor(videoSrc: string, stream: ISubtitleStream) {
    this.origin = {
      videoSrc,
      streamIndex: stream.index,
    };
    this.format = stream.codec_name as SubtitleFormat;
    this.language = normalizeCode(stream.tags.language || '');
    this.isDefault = !!stream.disposition.default;
    this.name = stream.tags.title || '';
  }

  type: SubtitleType.Embedded;

  private extractedSrc = '';
  async computeLang() {
    if (this.language && this.language !== LanguageCode.No) return this.language;
    this.extractedSrc = await embeddedSrcLoader(this.origin.videoSrc, this.origin.streamIndex, this.format);
    return inferLanguageFromPath(this.extractedSrc);
  }

  async load() {
    if (!this.extractedSrc) this.extractedSrc = await embeddedSrcLoader(this.origin.videoSrc, this.origin.streamIndex, this.format);
    const fileContent = await loadLocalFile(this.extractedSrc);
    switch (this.format) {
      case SubtitleFormat.AdvancedSubStationAplha:
      case SubtitleFormat.SubStationAlpha:
        return new AssSubtitle(fileContent);
      case SubtitleFormat.SubRip:
        return new SrtSubtitle(fileContent);
      case SubtitleFormat.WebVTT:
        return new VttSubtitle(fileContent);
    }
  }
}
