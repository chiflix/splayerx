import { extname, basename } from 'path';
import { open, readSync, readFile, closeSync } from 'fs';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import { ipcRenderer } from 'electron';
import helpers from '@/helpers';
import Sagi from '@/helpers/sagi';
import { normalizeCode } from '@/helpers/language';
import languageLoader from '@/helpers/subtitle/language';
import SubtitleLoader from './index';
import { SubtitleError, ErrorCodes } from './errors';

export { castArray } from 'lodash';

export { normalizeCode };

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
 * Get sample text from a local subtitle file.
 *
 * @async
 * @param {string} path - absolute path of the local subtitle file
 * @param {boolean} detectEncoding - to encoding detection or subtitle format detection
 * @returns {Promise<Buffer>} buffer of the sample text
 */
function getFragmentBuffer(path, detectLanguage) {
  return new Promise((resolve, reject) => {
    const size = detectLanguage ? 4096 * 20 : 4096;
    open(path, 'r', (err, fd) => {
      if (err) reject(err);
      const pos = 0;
      const buf = Buffer.alloc(size); // https://github.com/Microsoft/vscode/blob/f886dd4fb84bb82478bfab4a68cd3f31b32f5eb5/src/vs/base/node/encoding.ts#L268
      readSync(fd, buf, 0, size, pos);
      resolve(buf);
      closeSync(fd);
    });
  });
}

/**
 * Return the autoGuess encoding of the local subtitle file
 * @param {string} path - path of the local subtitle file
 * @returns chardet format encoding
 */
export async function localEncodingLoader(path) {
  const encodingBuffer = await getFragmentBuffer(path);
  return chardet.detect(encodingBuffer);
}

/**
 * Get the language code for a local subtitle file
 *
 * @async
 * @export
 * @param {string} path - path of a local subtitle file
 * @param {string} format - Formal subtitle format name, e.g. 'SubStation Alpha', 'WebVtt'.
 * @returns {string} language code(ISO-639-3) of the subtitle
 */
export async function localLanguageLoader(path, format) {
  const fileEncoding = await localEncodingLoader(path);
  try {
    const string = iconv.decode(await getFragmentBuffer(path, true), fileEncoding);
    console.log(languageLoader(string, format));
    return languageLoader(string, format)[0];
  } catch (e) {
    helpers.methods.addLog('error', {
      message: 'Unsupported Subtitle .',
      errcode: 'NOT_SUPPORTED_SUBTITLE',
    });
    throw new SubtitleError(ErrorCodes.ENCODING_UNSUPPORTED_ENCODING, `Unsupported encoding: ${fileEncoding}.`);
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
export function loadLocalFile(path) {
  return new Promise((resolve, reject) => {
    readFile(path, async (err, data) => {
      if (err) reject(err);
      const encoding = await localEncodingLoader(path);
      if (iconv.encodingExists(encoding)) {
        resolve(iconv.decode(data, encoding));
      } else {
        helpers.methods.addLog('error', {
          message: 'Unsupported Subtitle .',
          errcode: 'NOT_SUPPORTED_SUBTITLE',
        });
        reject(new SubtitleError(ErrorCodes.ENCODING_UNSUPPORTED_ENCODING, `Unsupported encoding: ${encoding}.`));
      }
    });
  });
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
  ipcRenderer.send('extract-subtitle-request', videoSrc, subtitleStreamIndex, SubtitleLoader.codecToFormat(subtitleCodec), await helpers.methods.mediaQuickHash(videoSrc));
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
    } else if (typeof funcOrObj[key] === 'function') {
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
