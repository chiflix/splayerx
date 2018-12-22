import { extname, basename } from 'path';
import { open, read, readFile, close, statSync } from 'fs';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import franc from 'franc';
import get from 'lodash/get';
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

/**
 * Get the extension of a local subtitle file.
 *
 * @export
 * @param {string} path - absolute path of the local subtitle file
 * @returns {string} an extension without '.'
 */
export function localFormatLoader(path) {
  return extname(path).slice(1);
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
    open(path, 'r', async (err, fd) => {
      if (err) reject(err);
      const pos = Math.round(statSync(path).size / 2);
      const buf = Buffer.alloc(4096);
      read(fd, buf, 0, 4096, pos, (err, buf) => {
        if (err) {
          close(fd);
          reject(err);
        }
        resolve(buf);
        close(fd);
      });
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
  return franc(stringCallback(bufferToString(buffer)));
}

/**
 * Get the name for a local subtitle file
 *
 * @export
 * @param {*} path - path of a local subtitle file
 * @param {*} videoName - (optional) name of the video matched with the subtitle
 * @param {*} language - (optional) language of the subtitle
 * @returns {string} filename or filename without videoname(with videoName param)
 * or language code for the file(with language param)
 */
export function localNameLoader(path, videoName, language) {
  const filename = basename(path).replace(/.(?!.*[.].+)/g, '');
  if (language) {
    return language;
  } else if (videoName) {
    return filename.replace(videoName);
  }
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
        resolve([iconv.decode(data, encoding), extname(path).slice(1)]);
      }
      reject(new Error(`Unsupported encoding: ${encoding}.`));
    });
  });
}

export function loadOnlineTranscriptInfo(mediaHash, transctiptHash) {
  return Sagi.getTranscriptInfo(mediaHash, transctiptHash);
}

export async function loadOnlineTranscript(hash) {
  return get(await Sagi.getTranscript(hash), 'array')[0];
}
