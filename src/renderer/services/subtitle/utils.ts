import { IDialogueTag, SubtitleFormat } from './parsers';
import { detect } from 'chardet';
import { encodingExists, decode } from 'iconv-lite';
import { open, read, close, readFile } from 'fs-extra';
import languageLoader from './language';
import { LanguageCode } from '@/libs/language';

/**
 * Cue tags getter for SubRip, SubStation Alpha and Online Transcript subtitles.
 *
 * @export
 * @param {string} text - cue text to evaluate.
 * @param {object} baseTags - default tags for the cue.
 * @returns {object} tags object for the cue
 */
export function tagsGetter(text: string, baseTags: IDialogueTag) {
  const tagRegex = /\{[^{}]*\}/g;
  const matchTags = text.match(tagRegex);
  const finalTags = { ...baseTags };
  if (matchTags) {
    const tagGetters = {
      an: (tag: string) => {
        const matchedAligment = tag.match(/\d/g);
        if (matchedAligment) return Number.parseFloat(matchedAligment[0])
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

/**
 * detect language of a local subtitle file
 * @param {string} path - path of the local subtitle file
 * @param {string} format - format of the subtitle, srt ass vtt etc.
 */
export async function localLanguageCodeLoader(path: string, format: SubtitleFormat, encoding?: string): Promise<LanguageCode> {
  try {
    const fd = await open(path, 'r');
    let fileEncoding = encoding || '';
    if (!encodingExists(fileEncoding)) {
      const encodingBufferSize = 4096;
      const encodingBuffer = Buffer.alloc(4096);
      await read(fd, encodingBuffer, 0, encodingBufferSize, 0);
      fileEncoding = await detectEncoding(encodingBuffer);
    }
    const languageBufferSize = 4096 * 20;
    const languageBuffer = Buffer.alloc(languageBufferSize);
    await read(fd, languageBuffer, 0, languageBufferSize, 0);
    await close(fd);
    return languageLoader(decode(languageBuffer, fileEncoding), format)[0];
  } catch (e) {
    return LanguageCode.No;
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
