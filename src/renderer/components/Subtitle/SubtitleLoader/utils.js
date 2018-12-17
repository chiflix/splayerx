import { extname, basename } from 'path';
import { open, readSync, readFile, closeSync, statSync } from 'fs';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import franc from 'franc';
import get from 'lodash/get';
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

export function objectTo(object) {
  const keys = Object.keys(object);
  if (keys.includes('func') && keys.inclides('params')) {
    return 'function';
  }
  return 'option';
}

export const mediaHash = helpers.methods.mediaQuickHash;

export function localFormatLoader(src) {
  return extname(src).slice(1);
}

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

function bufferToString(buffer) {
  const sampleStringEncoding = chardet.detect(buffer);
  return iconv.decode(buffer, sampleStringEncoding);
}

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

export async function localLanguageLoader(path, format) {
  const buffer = await getFragmentBuffer(path);
  const stringCallback = getSubtitleCallback(format || localFormatLoader(path));
  return franc(stringCallback(bufferToString(buffer)));
}

export function localNameLoader(path) {
  const filename = basename(path);
  return filename;
}

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

export function promisify(func) {
  return new Promise((resolve, reject) => {
    try {
      resolve(func());
    } catch (err) {
      reject(err);
    }
  });
}
