import { detect } from 'chardet';
import { encodingExists, decode } from 'iconv-lite';
import {
  open, read, close, readFile,
} from 'fs-extra';
import { extname } from 'path';
import {
  ITags, IOrigin, Type, Format, IParser,
} from '@/interfaces/ISubtitle';
import { LanguageCode } from '@/libs/language';

import {
  AssParser, SrtParser, SagiParser, VttParser,
} from '@/services/subtitle';

import { assFragmentLanguageLoader, srtFragmentLanguageLoader, vttFragmentLanguageLoader } from './languageLoader';
import { IEmbeddedOrigin } from '../loaders';
import { SagiSubtitlePayload } from '../parsers';

/**
 * Cue tags getter for SubRip, SubStation Alpha and Online Transcript subtitles.
 *
 * @export
 * @param {string} text - cue text to evaluate.
 * @param {object} baseTags - default tags for the cue.
 * @returns {object} tags object for the cue
 */
export function tagsGetter(text: string, baseTags: ITags) {
  const tagRegex = /\{[^{}]*\}/g;
  const matchTags = text.match(tagRegex);
  const finalTags = { ...baseTags };
  if (matchTags) {
    const tagGetters = {
      an: (tag: string) => {
        const matchedAligment = tag.match(/\d/g);
        if (matchedAligment) return Number.parseFloat(matchedAligment[0]);
        return undefined;
      },
      pos: (tag: string) => {
        const matchedCoords = tag.match(/\((.*)\)/);
        if (matchedCoords) {
          const coords = matchedCoords[1].split(',');
          return ({
            pos: {
              x: Number.parseFloat(coords[0]),
              y: Number.parseFloat(coords[1]),
            },
          });
        }
        return undefined;
      },
    };
    for (let tag of matchTags) {
      tag = tag.replace(/[{}\\/]/g, '');
      Object.keys(tagGetters).forEach((getterType) => {
        if (tag.startsWith(getterType)) {
          Object.assign(finalTags, tagGetters[getterType](tag));
        }
      });
    }
  }
  return finalTags;
}

/**
 * Detect encoding from a buffer
 *
 * @export
 * @param {Buffer} buffer - buffer to detect
 * @returns invalid encoding supported both by chardet and iconv-lite
 */
export async function detectEncoding(buffer: Buffer) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('Buffer expected.');
  const encoding = await detect(buffer);
  if (typeof encoding === 'string' && encodingExists(encoding)) return encoding;
  throw new Error(`Unsupported encoding: ${encoding}.`);
}

export async function extractTextFragment(path: string, encoding?: string) {
  try {
    const fd = await open(path, 'r');
    if (!encoding) {
      const encodingBufferSize = 4096;
      const encodingBuffer = Buffer.alloc(4096);
      await read(fd, encodingBuffer, 0, encodingBufferSize, 0);
      encoding = await detectEncoding(encodingBuffer);
    }
    if (!encodingExists(encoding)) throw new Error(`Unsupported encoding ${encoding}.`);

    const languageBufferSize = 4096 * 20;
    const languageBuffer = Buffer.alloc(languageBufferSize);
    await read(fd, languageBuffer, 0, languageBufferSize, 0);
    await close(fd);
    return decode(languageBuffer, encoding).replace(/\r?\n|\r/g, '\n');
  } catch (e) {
    return '';
  }
}

/**
 * Load string content from path
 *
 * @export
 * @param {string} path - path of a local file
 * @returns string content or err when read/decoding file
 */
export async function loadLocalFile(path: string, encoding?: string) {
  const fileBuffer = await readFile(path);
  if (encoding && encodingExists(encoding)) return decode(fileBuffer, encoding);
  const encodingBuffer = Buffer.from(fileBuffer, 4096);
  const fileEncoding = await detectEncoding(encodingBuffer);
  return decode(fileBuffer, fileEncoding);
}

export function pathToFormat(path: string): Format {
  const extension = extname(path).slice(1);
  switch (extension) {
    case 'ass':
      return Format.AdvancedSubStationAplha;
    case 'srt':
      return Format.SubRip;
    case 'ssa':
      return Format.SubStationAlpha;
    case 'vtt':
      return Format.WebVTT;
    default:
      return Format.Unknown;
  }
}

export function sourceToFormat(subtitleSource: IOrigin) {
  switch (subtitleSource.type) {
    case Type.Online:
    case Type.Translated:
      return Format.Sagi;
    case Type.Embedded: {
      const { extractedSrc } = (subtitleSource as IEmbeddedOrigin).source;
      if (extractedSrc) return pathToFormat(extractedSrc);
      return Format.Unknown;
    }
    default:
      return pathToFormat(subtitleSource.source as string);
  }
}

export function formatToExtension(format: Format): string {
  switch (format) {
    case Format.Sagi:
    case Format.WebVTT:
      return 'vtt';
    case Format.SubRip:
      return 'srt';
    default:
      return format;
  }
}

export async function inferLanguageFromPath(path: string): Promise<LanguageCode> {
  const format = await pathToFormat(path);
  const textFragment = await extractTextFragment(path);
  switch (format) {
    case Format.AdvancedSubStationAplha:
    case Format.SubStationAlpha:
      return assFragmentLanguageLoader(textFragment)[0];
    case Format.SubRip:
      return srtFragmentLanguageLoader(textFragment)[0];
    case Format.WebVTT:
      return vttFragmentLanguageLoader(textFragment)[0];
    default:
      throw new Error(`Unsupported format ${format}.`);
  }
}

export function getParser(format: Format, payload: unknown): IParser {
  switch (format) {
    case Format.AdvancedSubStationAplha:
    case Format.SubStationAlpha:
      return new AssParser(payload as string);
    case Format.SubRip:
      return new SrtParser(payload as string);
    case Format.Sagi:
      return new SagiParser(payload as SagiSubtitlePayload);
    case Format.WebVTT:
      return new VttParser(payload as string);
    default:
      throw new Error();
  }
}
