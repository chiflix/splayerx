import { extname, basename } from 'path';
import { open, readSync, readFile, closeSync, statSync } from 'fs';
import chardet from 'chardet';
import convert3To1 from 'iso-639-3-to-1';
import iconv from 'iconv-lite';
import franc from 'franc';
import helpers from '@/helpers';
import Sagi from '@/helpers/sagi';

export async function toPromise(func) {
  func.bind(null, arguments.slice(1));
  const result = func instanceof Promise ? await func() : func();
  return result;
}

export function toArray(element) {
  return element instanceof Array ? element : [element];
}

/**
 * Whether an object is a collection of methods or
 * an object with func and params attributes(i.e. SubtitleLoader version of a function).
 *
 * @export
 * @param {object} object - object to be evaluated
 * @returns {string} 'option' for methods or 'function' for a function
 */
export function objectTo(object) {
  const keys = Object.keys(object);
  if (keys.includes('func') && keys.includes('params')) {
    return 'function';
  }
  return 'option';
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
  return extname(src).slice(1);
}

/**
 * Get sample text from a local subtitle file.
 *
 * @async
 * @param {string} path - absolute path of the local subtitle file
 * @returns {Promise<Buffer>} buffer of the sample text
 */
function getFragmentBuffer(path) {
  return new Promise((resolve, reject) => {
    open(path, 'r', (err, fd) => {
      if (err) reject(err);
      const pos = Math.round(statSync(path).size / 2);
      const buf = Buffer.alloc(4096);
      readSync(fd, buf, 0, 4096, pos);
      resolve(buf);
      closeSync(fd);
    });
  });
}

/**
 * Turn a buffer to string with proper enconding with chardet and iconv-lite.
 *
 * @param {Buffer} buffer - buffer of string
 * @returns {string} string with proper encoding
 */
function bufferToString(buffer) {
  const sampleStringEncoding = chardet.detect(buffer);
  return iconv.decode(buffer, sampleStringEncoding);
}

/**
 * Get callback for turn subtitle into plain text without second line.
 *
 * @param {string} subtitleFormat - Formal subtitle format name, e.g. 'SubStation Alpha', 'WebVtt'.
 * @returns {fucntion} Callback for removing tags and other lines for each cue text.
 */
function getSubtitleCallback(subtitleFormat) {
  switch (subtitleFormat) {
    case 'SubStation Alpha':
      return str => str.replace(/^(Dialogue:)(.*\d,)(((\d{0,2}:){2}\d{0,2}\d{0,2}([.]\d{0,3})?,)){2}(.*,)(\w*,)(\d+,){3}(\w*,)|(\\[nN])|([\\{\\]\\.*[\\}].*)/gm, '');
    case 'SubRip':
    case 'WebVTT':
      return str => str.replace(/^\d+.*/gm, '').replace(/\n.*\s{1,}/gm, '');
    default:
      return str => str.replace(/\d/gm, '');
  }
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
  const buffer = await getFragmentBuffer(path);
  const stringCallback = getSubtitleCallback(format || localFormatLoader(path));
  return convert3To1(franc(stringCallback(bufferToString(buffer))));
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
    readFile(path, (err, data) => {
      if (err) reject(err);
      const encoding = chardet.detect(data.slice(0, 100));
      if (iconv.encodingExists(encoding)) {
        resolve(iconv.decode(data, encoding));
      }
      reject(new Error(`Unsupported encoding: ${encoding}.`));
    });
  });
}

export function loadOnlineTranscript(hash) {
  return Sagi.getTranscript(hash);
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
