import { extname, basename } from 'path';
import { open, read, readFile, close } from 'fs-extra';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import { ipcRenderer } from 'electron';
import helpers from '@/helpers';
import Sagi from '@/helpers/sagi';
import { normalizeCode } from '@/helpers/language';
import languageLoader from '@/helpers/subtitle/language';
import SubtitleLoader from './index';
import { SubtitleError, ErrorCodes } from './errors';

export { castArray, cloneDeep } from 'lodash';

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

/**
 * @description 给字幕dialogues添加轨道 如果字幕条有交叉，后面的字幕就降到下面的轨道
 * @author tanghaixiang@xindong.com
 * @date 2019-03-25
 * @export
 * @param {Array} dialogues 字幕条集合
 * @param {String} type 字幕格式
 */
export function generateTrack(dialogues, type) { // eslint-disable-line
  const startTrack = 1;
  let init = false;
  const store = {};
  const isOtherPos = (e) => {
    const tags = e.fragments && e.fragments[0] && e.fragments[0].tags;
    return type === 'ass' && tags && (tags.pos || tags.alignment !== 2);
  };
  const isCross = (l, r) => {
    const nl = l.start < r.start && l.end <= r.start;
    const rl = r.start < l.start && r.end <= l.start;
    return !(nl || rl);
  };
  // 字幕比较
  const compare = (i, j) => { // eslint-disable-line
    const current = dialogues[i];
    const left = dialogues[j];
    if (isOtherPos(left)) {
      // 如果不是第2块的字幕或者有定位的字幕，就和再前面的比较
      return compare(i, j - 1);
    } else if (isCross(left, current)) {
      // 有交叉，就再前面的轨道自增
      current.track = left.track + 1;
      // 标记当前字幕是不是被前面的完全超过
      // 超过的话，后面的字幕如何和当前字幕不交叉，也需要和之前的字幕比较
      current.overRange = left.end > current.end;
    } else if (left.overRange) {
      // 如果和前面的不交叉，但是前面的字幕被再前面的超过
      // 需要和再前面的字幕比较
      return compare(i, j - 1);
    } else {
      current.track = startTrack;
    }
    // 需和之前的字幕(开始到最近的一级轨道字幕)比较，如果和一级轨道有交叉
    // 前面的一级轨道的字幕就保存当前字幕的轨道，以备用，跳出循环，后面，需要把这些字幕的轨道
    // 往下降
    for (let k = j - left.track; k > -1; k -= 1) {
      const left = dialogues[k];
      if (isCross(left, current) && !isOtherPos(left) && left.track === 1) {
        store[k] = store[k] && store[k] > current.track ? store[k] : current.track;
        break;
      }
    }
    return current;
  };
  dialogues.map((e, i) => {
    // 如果不是第2块的字幕或者有定位的字幕，就不添加轨道
    // 因为在高级模式下这些字幕都被过滤掉了，看不到了
    if (isOtherPos(e)) {
      return e;
    }
    // 给第一个合格的字幕加轨道
    if (!init) {
      e.track = startTrack;
      init = true;
      return e;
    }
    return compare(i, i - 1);
  });
  // 过滤所以需要降轨道的字幕
  for (const i in store) {
    if (dialogues[i]) {
      let index = (i * 1) + 1;
      const step = store[i];
      dialogues[i].track += step;
      // 这个一级轨道到到下个一级轨道之间的字幕轨道同步降级
      while (dialogues[index].track > 1) {
        dialogues[index].track += step;
        index += 1;
      }
    }
  }
}

/**
 * @description 合并同一个时间内,同一位置的字幕
 * @author tanghaixiang@xindong.com
 * @date 2019-03-26
 * @export
 * @param {Array} dialogues 字幕条集合
 * @param {String} type 字幕格式
 */
export function megreSameTime(dialogues, type) {
  const target = {
  };
  let text = '';
  // 判断两个字幕是不是相同位置
  const same = (l, r) => { // eslint-disable-line
    text = '';
    let leftTags;
    let rightTags;
    let samePos = false;
    if (type === 'ass') {
      leftTags = l.fragments && l.fragments[0] && l.fragments[0].tags;
      rightTags = r.fragments && r.fragments[0] && r.fragments[0].tags;
      text = r.fragments && r.fragments[0] && r.fragments[0].text;
    } else {
      leftTags = l.tags;
      rightTags = r.tags;
      text = r.text;
    }
    // 是不是相同的alignment
    const sameAlignment = leftTags.alignment === rightTags.alignment;
    if (typeof leftTags.pos === typeof rightTags.pos) {
      // 是不是相同的定位
      samePos = typeof leftTags.pos === 'undefined' || leftTags.pos === null ? true :
        leftTags.pos.x === rightTags.pos.x && leftTags.pos.y === rightTags.pos.y;
    }
    return sameAlignment && samePos;
  };
  for (let i = 0; i < dialogues.length; i += 1) {
    const key = `${dialogues[i].start}-${dialogues[i].end}`;
    if (typeof target[key] !== 'undefined') {
      if (same(dialogues[target[key]], dialogues[i]) && text !== '') {
        dialogues[target[key]].text += `\n${text}`;
        dialogues.splice(i, 1);
        i -= 1;
      }
    } else {
      target[key] = i;
    }
  }
}
