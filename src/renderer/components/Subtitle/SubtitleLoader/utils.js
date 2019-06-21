import { extname, basename } from 'path';
import {
  open, read, readFile, close,
} from 'fs-extra';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import { ipcRenderer } from 'electron';
import { castArray, flatten } from 'lodash';
import helpers from '@/helpers';
import Sagi from '@/libs/sagi';
import { normalizeCode } from '@/helpers/language';
import languageLoader from '@/helpers/subtitle/language';
import { SubtitleError, ErrorCodes } from './errors';

export { get } from 'lodash';
export { normalizeCode, castArray };

const files = require.context('.', false, /\.loader\.js$/);
const loaders = {};

files.keys().forEach((key) => {
  loaders[key.replace(/(\.\/|\.loader|\.js)/g, '')] = files(key).default;
});

export const supportedFormats = flatten(Object.keys(loaders)
  .map(loaderType => loaders[loaderType].supportedFormats));

export const supportedCodecs = flatten(Object.keys(loaders)
  .map(loaderType => [loaders[loaderType].name, loaders[loaderType].longName]));

export function codecToFormat(codec) {
  return Object.values(loaders).filter(loader => new RegExp(`${codec}`).test(loader.name))[0].supportedFormats[0];
}

export function getLoader(format) {
  return Object.values(loaders)
    .find(loader => castArray(loader.supportedFormats).includes(format));
}

export const mediaHash = helpers.methods.mediaQuickHash;

/**
 * Get the extension of a local subtitle file.
 *
 * @export
 * @param {string} path - absolute path of the local subtitle file
 * @returns {string} an extension without '.'
 */
export function localFormatLoader(src) {
  return extname(src).slice(1).toLowerCase();
}

/**
 * Detect encoding from a buffer
 *
 * @export
 * @param {Buffer} buffer - buffer to detect
 * @returns invalid encoding supported both by chardet and iconv-lite
 */
export async function detectEncoding(buffer) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('Buffer expected.');
  const encoding = await chardet.detect(buffer);
  if (iconv.encodingExists(encoding)) return encoding;
  throw new SubtitleError(ErrorCodes.ENCODING_UNSUPPORTED_ENCODING, `Unsupported encoding: ${encoding}.`);
}

/**
 * detect encoding from file sync
 * @param {string} path - path of the file
 */
export function detectEncodingFromFileSync(path) {
  const encoding = chardet.detectFileSync(path, { sampleSize: 4096 });
  if (iconv.encodingExists(encoding)) return encoding;
  throw new SubtitleError(ErrorCodes.ENCODING_UNSUPPORTED_ENCODING, `Unsupported encoding: ${encoding}.`);
}

/**
 * detect language of a local subtitle file
 * @param {string} path - path of the local subtitle file
 * @param {string} format - format of the subtitle, srt ass vtt etc.
 */
export async function localLanguageLoader(path, format, encoding) {
  try {
    const fd = await open(path, 'r');
    let fileEncoding = encoding;
    if (!iconv.encodingExists(encoding)) {
      const encodingBufferSize = 4096;
      const encodingBuffer = Buffer.alloc(4096);
      await read(fd, encodingBuffer, 0, encodingBufferSize, 0);
      fileEncoding = await detectEncoding(encodingBuffer);
    }
    const languageBufferSize = 4096 * 20;
    const languageBuffer = Buffer.alloc(languageBufferSize);
    await read(fd, languageBuffer, 0, languageBufferSize, 0);
    await close(fd);
    return languageLoader(iconv.decode(languageBuffer, fileEncoding), format)[0];
  } catch (e) {
    return 'und';
  }
}

export function localNameLoader(path) {
  const filename = basename(path);
  return filename;
}

/**
 * Cue tags getter for SubRip, SubStation Alpha and Online Transcript subtitles.
 *
 * @export
 * @param {string} text - cue text to evaluate.
 * @param {object} baseTags - default tags for the cue.
 * @returns {object} tags object for the cue
 */
export function tagsGetter(text, baseTags) {
  const tagRegex = /\{[^{}]*\}/g;
  const matchTags = text.match(tagRegex);
  const finalTags = { ...baseTags };
  if (matchTags instanceof Array) {
    const tagGetters = {
      an: tag => ({ alignment: Number.parseFloat(tag.match(/\d/g)[0]) }),
      pos: (tag) => {
        const coords = tag.match(/\((.*)\)/)[1].split(',');
        return ({
          pos: {
            x: Number.parseFloat(coords[0]),
            y: Number.parseFloat(coords[1]),
          },
        });
      },
    };
    /* eslint-disable no-restricted-syntax */
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
 * Load string content from path
 *
 * @export
 * @param {string} path - path of a local file
 * @returns {Promise<string|Error>} string content or err when read/decoding file
 */
export async function loadLocalFile(path, encoding) {
  const fileBuffer = await readFile(path);
  if (iconv.encodingExists(encoding)) return iconv.decode(fileBuffer, encoding);
  const encodingBuffer = Buffer.from(fileBuffer, 4096);
  const fileEncoding = await detectEncoding(encodingBuffer);
  return iconv.decode(fileBuffer, fileEncoding);
}
/**
 * Get extracted embedded subtitles's local src
 *
 * @export
 * @param {string} videoSrc - path of the video file
 * @param {number} subtitleStreamIndex - the number of the subtitle stream index
 * @param {string} subtitleCodec - the codec of the embedded subtitle
 * @returns {Promise<string|SubtitleError>} the subtitle path string or SubtitleError
 */
export async function embeddedSrcLoader(videoSrc, subtitleStreamIndex, subtitleCodec) {
  ipcRenderer.send('extract-subtitle-request', videoSrc, subtitleStreamIndex, codecToFormat(subtitleCodec), await helpers.methods.mediaQuickHash(videoSrc));
  return new Promise((resolve, reject) => {
    ipcRenderer.once('extract-subtitle-response', (event, { error, index, path }) => {
      if (error) reject(new SubtitleError(ErrorCodes.SUBTITLE_RETRIEVE_FAILED, `${videoSrc}'s No.${index} extraction failed with ${error}.`));
      resolve(path);
    });
  });
}

/**
 * Load embedded subtitls from streamIndex with embeddedSrcLoader
 *
 * @export
 * @param {string} videoSrc - path of the video file
 * @param {number} subtitleStreamIndex - the number of the subtitle stream index
 * @param {string} subtitleCodec - the codec of the embedded subtitle
 * @returns {Promise<string|SubtitleError>} the subtitles string or SubtitleError
 */
export function loadEmbeddedSubtitle(videoSrc, subtitleStreamIndex, subtitleCodec) {
  return new Promise((resolve, reject) => {
    embeddedSrcLoader(videoSrc, subtitleStreamIndex, subtitleCodec).then((path) => {
      this.metaInfo.format = extname(path).slice(1);
      resolve(loadLocalFile(path));
    }).catch((err) => {
      reject(err);
    });
  });
}

export function loadOnlineTranscript(hash) {
  return Sagi.getTranscript({ transcriptIdentity: hash });
}

export function promisify(func) {
  return new Promise((resolve, reject) => {
    try {
      resolve(func());
    } catch (err) {
      reject(err);
    }
  });
}
/**
 * Normalize function and parameters from an object, a string or a function
 *
 * @export
 * @param {function|string|object} funcOrObj - function, string
 * or object to extract function(s) from
 * @param {string|array} defaultParams - default params field when no params found
 * @returns function object with func and params or functions object with keys
 */
export function functionExtraction(funcOrObj, defaultParams) {
  if (typeof funcOrObj === 'string') return { func: args => args, params: funcOrObj };
  if (typeof funcOrObj === 'function') return { func: funcOrObj, params: defaultParams || 'src' };
  const keys = Object.keys(funcOrObj);
  const result = {};
  keys.some((key) => {
    if (key === 'func' || key === 'params') {
      result.func = funcOrObj.func;
      result.params = funcOrObj.params || 'src';
      return true;
    }
    if (typeof funcOrObj[key] === 'function') {
      result[key] = {
        func: funcOrObj[key],
        params: defaultParams || 'src',
      };
    } else if (typeof funcOrObj[key] === 'string') {
      result[key] = {
        func: result => result,
        params: funcOrObj[key],
      };
    } else if (typeof funcOrObj[key] === 'object') {
      result[key] = {
        func: funcOrObj[key].func,
        params: funcOrObj[key].params || defaultParams || 'src',
      };
    }
    return false;
  });
  return result;
}
