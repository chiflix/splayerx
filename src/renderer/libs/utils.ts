import { createHash } from 'crypto';
// @ts-ignore
import romanize from 'romanize';
import { times, padStart, sortBy } from 'lodash';
import { sep, basename, join } from 'path';
import { ensureDir } from 'fs-extra';
import { remote } from 'electron';
// @ts-ignore
import { promises as fsPromises } from 'fs';
// @ts-ignore
import nzh from 'nzh';
import { SubtitleControlListItem, Type } from '@/interfaces/ISubtitle';
import { codeToLanguageName } from './language';
import { IEmbeddedOrigin } from '@/services/subtitle';
import {
  ELECTRON_CACHE_DIRNAME,
  DEFAULT_DIRNAME,
  VIDEO_DIRNAME, SUBTITLE_DIRNAME,
} from '@/constants';
// @ts-ignore

/** 计算文本宽度
 * @description
 * @param {string} fontSize
 * @param {string} fontFamily
 * @param {string} text
 * @param {string} lineHeight
 * @param {string} zoom
 * @returns {number}
 */
export function calculateTextSize(
  fontSize: string,
  fontFamily: string,
  lineHeight: string,
  zoom: string,
  text: string,
): { width: number, height: number } {
  const span: HTMLElement = document.createElement('span');
  const result = { width: span.offsetWidth, height: span.offsetHeight };
  span.style.visibility = 'hidden';
  span.style.fontSize = fontSize;
  span.style.fontFamily = fontFamily;
  span.style.display = 'inline-block';
  span.style.fontWeight = '700';
  span.style.letterSpacing = '0.2px';
  span.style.lineHeight = lineHeight;
  span.style.zoom = zoom;
  document.body.appendChild(span);
  if (typeof span.textContent !== 'undefined') {
    span.textContent = text;
  } else {
    span.innerText = text;
  }
  result.width = parseFloat(window.getComputedStyle(span).width || '0') - result.width;
  result.height = parseFloat(window.getComputedStyle(span).height || '0') - result.height;
  if (span.parentNode) {
    span.parentNode.removeChild(span);
  }
  return result;
}

// 最后一帧图片数据格式
export type ShortCut = {
  shortCut: string,
  smallShortCut: string,
}

/** 最后一帧图的大尺寸
 * @constant
 * @type number
 */
const MAX_SHORT_CUT_SIZE = 1080;
/** 最后一帧图的小尺寸
 * @constant
 * @type number
 */
const MIN_SHORT_CUT_SIZE = 122.6;
/** 最后一帧图的图片质量
 * @constant
 * @type number
 */
const SHORT_CURT_QUALITY = 0.8;
/** 最后一帧图的图片导出格式
 * @constant
 * @type string
 */
const SHORT_CURT_TYPE = 'image/jpeg';

/**
 * @description canvas 生成观看视频的最后一帧图片
 * @author tanghaixiang
 * @param {HTMLVideoElement} video 需要截取的视频元素
 * @param {HTMLCanvasElement} canvas 截图操作的canvas元素
 * @param {number} videoWidth 视频宽
 * @param {number} videoHeight 视频高
 * @returns {ShortCut} 最后一帧图，有常规尺寸和小尺寸
 */
export function generateShortCutImageBy(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  videoWidth: number,
  videoHeight: number,
): ShortCut {
  const result: ShortCut = {
    shortCut: '',
    smallShortCut: '',
  };
  const canvasCTX = canvas.getContext('2d');
  if (canvasCTX) {
    [canvas.width, canvas.height] = [(videoWidth / videoHeight)
      * MAX_SHORT_CUT_SIZE, MAX_SHORT_CUT_SIZE];
    canvasCTX.drawImage(
      video, 0, 0, videoWidth, videoHeight,
      0, 0, (videoWidth / videoHeight) * MAX_SHORT_CUT_SIZE, MAX_SHORT_CUT_SIZE,
    );
    const imagePath = canvas.toDataURL(SHORT_CURT_TYPE, SHORT_CURT_QUALITY);
    result.shortCut = imagePath;
    // 用于测试截图的代码，以后可能还会用到
    // const img = imagePath.replace(/^data:image\/\w+;base64,/, '');
    // fs.writeFileSync('/Users/jinnaide/Desktop/screenshot.png', img, 'base64');
    [canvas.width, canvas.height] = [(videoWidth / videoHeight)
      * MIN_SHORT_CUT_SIZE, MIN_SHORT_CUT_SIZE];
    canvasCTX.drawImage(
      video, 0, 0, videoWidth, videoHeight,
      0, 0, (videoWidth / videoHeight) * MIN_SHORT_CUT_SIZE, MIN_SHORT_CUT_SIZE,
    );
    const smallImagePath = canvas.toDataURL(SHORT_CURT_TYPE, SHORT_CURT_QUALITY);
    result.smallShortCut = smallImagePath;
  }
  return result;
}

function md5Hex(text: Buffer) {
  return createHash('md5').update(text).digest('hex');
}

/** Calculate hash of file */
export async function mediaQuickHash(filePath: string) {
  const fileHandler = await fsPromises.open(filePath, 'r');
  const len = (await fsPromises.stat(filePath)).size;
  const position = [
    4096,
    Math.floor(len / 3),
    Math.floor(len / 3) * 2,
    len >= 8192 ? len - 8192 : 0,
  ];
  const res = await Promise.all(times(4).map(async (i) => {
    const buf = Buffer.alloc(4096);
    const { bytesRead } = await fileHandler.read(buf, 0, 4096, position[i]);
    return md5Hex(buf.slice(0, bytesRead));
  }));
  fileHandler.close();
  return res.join('-');
}

/** Silently calculate hash of file, returns null if there was an error */
mediaQuickHash.try = async (filePath: string) => {
  try {
    return await mediaQuickHash(filePath);
  } catch (ex) {
    console.error(ex);
    return null;
  }
};

export function timecodeFromSeconds(s: number) {
  const dt = new Date(Math.abs(s) * 1000);
  const hours = dt.getUTCHours();
  const minutes = padStart(dt.getUTCMinutes().toString(), 2, '0');
  const seconds = padStart(dt.getUTCSeconds().toString(), 2, '0');

  if (hours > 0) {
    return `${hours}:${minutes}:${seconds}`;
  }
  return `${minutes}:${seconds}`;
}

/**
 * @description
 * @param {string} videoSrc 视频路径
 * @returns {string} hints
 */
export function generateHints(videoSrc: string): string {
  let result = '';
  videoSrc.split(sep).reverse().some((dirOrFileName, index) => {
    if (index === 0) {
      result = dirOrFileName;
      return false;
    }
    if (index <= 2) {
      result = `${dirOrFileName}${sep}${result}`;
      return false;
    }
    result = `${sep}${result}`;
    return true;
  });
  return result;
}

export function calculatedName(
  item: SubtitleControlListItem,
  list: SubtitleControlListItem[],
): string {
  let name = '';
  if (item.type === Type.Local) {
    name = basename(item.source as string);
  } else if (item.type === Type.Embedded) {
    let embeddedList = list
      .filter((s: SubtitleControlListItem) => s.type === Type.Embedded);
    embeddedList = sortBy(
      embeddedList,
      (s: SubtitleControlListItem) => (s as IEmbeddedOrigin).source.streamIndex,
    );
    const sort = embeddedList.findIndex((s: SubtitleControlListItem) => s.id === item.id) + 1;
    name = `${romanize(sort)} - ${codeToLanguageName(item.language)}`;
  } else if (item.type === Type.Online) {
    const sort = list
      .filter((s: SubtitleControlListItem) => s.type === Type.Online
        && s.language === item.language)
      .findIndex((s: SubtitleControlListItem) => s.id === item.id) + 1;
    name = `${codeToLanguageName(item.language)} ${romanize(sort)}`;
  }
  return name;
}
// season math reg
const SEREG = /([\u005b.-\s_]s[e]?(\d+)|season(\d+)|第(\d+)季|第([零一二三四五六七八九十百千]+)季)/i;
// episode match reg
const EPREG = /(e[p]?(\d+)[\u005d.-\s_]?|episode(\d+)|第(\d+)集|第([零一二三四五六七八九十百千]+)集)/i;

/**
 *
 * @description 匹配路径中视频文件名称里面的season和episode
 * @param {String} path 视频名称
 * @returns {Object} example: {season: null, episode: "02"}
 */
export function parseNameFromPath(path: string) {
  path = basename(path.trim()).replace(/\.(\w+)$/i, '.');
  const result = {
    season: null,
    episode: null,
  };
  [
    {
      section: 'season',
      pattern: SEREG,
    },
    {
      section: 'episode',
      pattern: EPREG,
    },
  ].forEach((item) => {
    path = path.trim().replace(item.pattern, (match, $0, $1, $2, $3, $4) => {
      // $0 -> matched content
      // $1 -> first offset (\d+)
      // $2 -> second offset (\d+)
      // $3 -> third offset (\d+)
      // $4 -> third offset ([零一二三四五六七八九十百千]+)
      let p = null;
      if ($1 !== undefined) p = parseInt($1, 10);
      if ($2 !== undefined) p = parseInt($2, 10);
      if ($3 !== undefined) p = parseInt($3, 10);
      if (p !== null) {
        result[item.section] = p < 10 ? `0${p}` : `${p}`;
        return '';
      }
      if ($4) {
        const p = nzh.cn.decodeS($4);
        if (p > 0) result[item.section] = p < 10 ? `0${p}` : `${p}`;
        return '';
      }
      if (match) return match;
      return '';
    });
  });
  return result;
}

/** get video cache dir */
export function getVideoDir(videoHash?: string) {
  const videoDir = videoHash
    ? join(
      remote.app.getPath(ELECTRON_CACHE_DIRNAME),
      DEFAULT_DIRNAME,
      VIDEO_DIRNAME,
      videoHash,
    ) : join(
      remote.app.getPath(ELECTRON_CACHE_DIRNAME),
      DEFAULT_DIRNAME,
      VIDEO_DIRNAME,
    );
  return ensureDir(videoDir).then(() => videoDir);
}

/** get subtitle cache dir */
export function getSubtitleDir() {
  const subtitleDir = join(
    remote.app.getPath(ELECTRON_CACHE_DIRNAME),
    DEFAULT_DIRNAME,
    SUBTITLE_DIRNAME,
  );
  return ensureDir(subtitleDir).then(() => subtitleDir);
}
