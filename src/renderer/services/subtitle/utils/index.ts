import { detect } from 'chardet';
import { encodingExists, decode } from 'iconv-lite';
import {
  open, read, close, readFile, existsSync, outputFile,
} from 'fs-extra';
import uuidv4 from 'uuid/v4';
import { extname, join } from 'path';
import {
  ITags, IOrigin, Type, Format, IParser, ILoader, Cue, IVideoSegments, IMetadata, TextCue,
} from '@/interfaces/ISubtitle';
import { LanguageCode } from '@/libs/language';

import {
  AssParser, SrtParser, SagiTextParser, VttParser, ModifiedParser,
} from '@/services/subtitle';

import { assFragmentLanguageLoader, srtFragmentLanguageLoader, vttFragmentLanguageLoader } from './languageLoader';
import {
  IEmbeddedOrigin,
  EmbeddedStreamLoader, LocalTextLoader, SagiLoader, LocalBinaryLoader, ModifiedLoader,
} from './loaders';
import { SagiImageParser } from '../parsers/sagiImage';
import { SUBTITLE_FULL_DIRNAME } from '@/constants';

/**
 * TextCue tags getter for SubRip, SubStation Alpha and Online Transcript subtitles.
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
    case 'sis':
      return Format.SagiImage;
    default:
      return Format.Unknown;
  }
}

export function sourceToFormat(subtitleSource: IOrigin) {
  switch (subtitleSource.type) {
    case Type.Online:
    case Type.Translated:
    case Type.PreTranslated:
      return Format.SagiText;
    case Type.Embedded: {
      const { isImage } = (subtitleSource as IEmbeddedOrigin).source;
      if (isImage) return Format.SagiImage;
      return Format.AdvancedSubStationAplha;
    }
    default:
      return pathToFormat(subtitleSource.source as string);
  }
}

export function formatToExtension(format: Format): string {
  switch (format) {
    case Format.SagiText:
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

export function getDialogues(dialogues: TextCue[], time?: number) {
  return typeof time === 'undefined' ? dialogues
    : dialogues.filter(({ start, end, text }) => (
      (start <= time && end >= time) && !!text
    ));
}

export function getLoader(source: IOrigin, format: Format): ILoader {
  switch (source.type) {
    default:
      throw new Error('Unknown source type.');
    case Type.Embedded: {
      const { videoPath, streamIndex } = (source as IEmbeddedOrigin).source;
      return new EmbeddedStreamLoader(videoPath, streamIndex, format);
    }
    case Type.Local: {
      switch (format) {
        case Format.AdvancedSubStationAplha:
        case Format.SubStationAlpha:
        case Format.SubRip:
        case Format.WebVTT:
          return new LocalTextLoader(source.source as string);
        case Format.SagiImage:
          return new LocalBinaryLoader(source.source as string);
        default:
          throw new Error(`Unknown local subtitle's format ${format}.`);
      }
    }
    case Type.Online:
      return new SagiLoader(source.source as string);
    case Type.Translated:
      return new SagiLoader(source.source as string);
    case Type.PreTranslated:
      return new SagiLoader(source.source as string);
    case Type.Modified:
      return new ModifiedLoader((source.source as { source: string }).source);
  }
}

export function getParser(
  format: Format,
  loader: ILoader,
  videoSegments: IVideoSegments,
): IParser {
  if (loader.source.type === Type.Modified) {
    return new ModifiedParser(loader as ModifiedLoader, videoSegments);
  }
  switch (format) {
    default:
      throw new Error('Unknown format');
    case Format.AdvancedSubStationAplha:
    case Format.SubStationAlpha:
      return new AssParser(loader, videoSegments);
    case Format.SagiText:
      return new SagiTextParser(loader as SagiLoader, videoSegments);
    case Format.SubRip:
      return new SrtParser(loader as LocalTextLoader, videoSegments);
    case Format.WebVTT:
      return new VttParser(loader as LocalTextLoader, videoSegments);
    case Format.DvbSub:
    case Format.HdmvPgs:
    case Format.VobSub:
      throw new Error('Local bitmap-based subtitle loading hasn\'t been implemented yet!');
    case Format.SagiImage:
      return new SagiImageParser(loader, videoSegments);
  }
}

export async function storeModified(
  dialogues: Cue[],
  meta?: IMetadata,
): Promise<{ hash: string, path: string }> {
  const result = {
    hash: '',
    path: '',
  };
  const hash = uuidv4();
  const storedPath = join(SUBTITLE_FULL_DIRNAME, `${hash}.modifed`);
  if (!existsSync(storedPath)) {
    try {
      const bin = Buffer.from(`\ufeff${JSON.stringify({ dialogues, meta })}`, 'utf8');
      await outputFile(storedPath, bin);
      result.hash = hash;
      result.path = storedPath;
    } catch (error) {
      // empty
    }
  }
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
export function generateTrack(dialogues: TextCue[]) {
  const startTrack = 1;
  let init = false;
  const store = {};
  const isOtherPos = (e: TextCue) => e.tags && (e.tags.pos || e.tags.alignment !== 2);
  const isCross = (l: TextCue, r: TextCue) => {
    const nl = l.start < r.start && l.end <= r.start;
    const rl = r.start < l.start && r.end <= l.start;
    return !(nl || rl);
  };
  // 字幕比较
  const compare = (i: number, j: number): TextCue => {
    const current = dialogues[i];
    const left = dialogues[j];
    if (isOtherPos(left)) {
      // 如果不是第2块的字幕或者有定位的字幕，就和再前面的比较
      return compare(i, j - 1);
    } else if (isCross(left, current)) { // eslint-disable-line
      // 有交叉，就再前面的轨道自增
      current.track = left.track ? left.track + 1 : 1;
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
    for (let k = left.track ? j - left.track : j - 1; k > -1; k -= 1) {
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
      let index = `${Number(i) + 1}`;
      const step = store[i];
      dialogues[i].track += step;
      // 这个一级轨道到到下个一级轨道之间的字幕轨道同步降级
      while (dialogues[index].track > 1) {
        dialogues[index].track += step;
        index = `${Number(index) + 1}`;
      }
    }
  }

  return dialogues;
}

/**
 * @description 合并同一个时间内,同一位置的字幕
 * @author tanghaixiang
 * @param {TextCue[]} dialogues
 * @returns {TextCue[]}
 */
export function megreSameTime(dialogues: TextCue[]): TextCue[] {
  const target = {
  };
  let text = '';
  // 判断两个字幕是不是相同位置
  const same = (l: TextCue, r: TextCue) => { // eslint-disable-line
    text = r.text;
    let samePos = false;
    const leftTags = l.tags;
    const rightTags = r.tags;
    if (leftTags && typeof leftTags === typeof rightTags) {
      // 是不是相同的alignment
      const sameAlignment = leftTags.alignment === rightTags.alignment;
      if (typeof leftTags.pos === typeof rightTags.pos) {
        // 是不是相同的定位
        if (typeof leftTags.pos === 'undefined' || leftTags.pos === null) {
          samePos = true;
        } else if (leftTags.pos && rightTags.pos) {
          samePos = leftTags.pos.x === rightTags.pos.x && leftTags.pos.y === rightTags.pos.y;
        }
      }
      return sameAlignment && samePos;
    }
    return false;
  };
  for (let i = 0; i < dialogues.length; i += 1) {
    const key = `${dialogues[i].start}-${dialogues[i].end}`;
    if (typeof target[key] !== 'undefined') {
      if (same(dialogues[target[key]], dialogues[i]) && text !== '') {
        dialogues[target[key]].text += `<br>${text}`;
        dialogues.splice(i, 1);
        i -= 1;
      }
    } else {
      target[key] = i;
    }
  }
  return dialogues;
}

const isCross = (l: Cue, r: Cue) => {
  const nl = l.start < r.start && l.end <= r.start;
  const rl = r.start < l.start && r.end <= l.start;
  return !(nl || rl);
};

export function deleteCrossSubs(left: Cue[], right: Cue[]) {
  return left.filter((e: Cue) => !right.some((c: Cue) => isCross(c, e)));
}
