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
import { IEmbeddedOrigin } from '@/services/subtitle';
import {
  ELECTRON_CACHE_DIRNAME,
  DEFAULT_DIRNAME,
  VIDEO_DIRNAME, SUBTITLE_DIRNAME,
} from '@/constants';
import { codeToLanguageName, LanguageCode } from './language';
import { checkPathExist, write, deleteDir } from './file';

/**
 * @description 获取electron应用用户目录下的设定的缓存路径
 * @author tanghaixiang
 * @returns String 缓存路径
 */
export function getDefaultDataPath() {
  return join(remote.app.getPath(ELECTRON_CACHE_DIRNAME), DEFAULT_DIRNAME);
}

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
// const MIN_SHORT_CUT_SIZE = 122.6;
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
    result.shortCut = result.smallShortCut = imagePath;
  }
  return result;
}

function md5Hex(text: Buffer) {
  return createHash('md5').update(text).digest('hex');
}

/** Calculate hash of file */
export async function mediaQuickHash(filePath: string) {
  if (!filePath) return '';
  if (filePath.startsWith('http')) return 'open-url-hash'; // TODO design openUrl hash

  const fileHandler = await fsPromises.open(filePath, 'r');
  const len = (await fsPromises.stat(filePath)).size;
  const position = [
    4096,
    Math.floor(len / 3),
    Math.floor(len / 3) * 2,
    len - 8192,
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
    const { language } = item;
    if (language === LanguageCode.No || language === LanguageCode.Default) return `${romanize(sort)}`;
    if (language === LanguageCode['zh-CN'] || language === LanguageCode['zh-TW']) return `${romanize(sort)} - 中文`;
    return `${romanize(sort)} - ${codeToLanguageName(item.language)}`;
  } else if (item.type === Type.Online) {
    const sort = list
      .filter((s: SubtitleControlListItem) => s.type === Type.Online
        && s.language === item.language)
      .findIndex((s: SubtitleControlListItem) => s.id === item.id) + 1;
    name = `${codeToLanguageName(item.language)} ${romanize(sort)}`;
  } else if (item.type === Type.Translated) {
    name = `${codeToLanguageName(item.language)} AI`;
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

const table = '00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D';
/** Get  , support only ASCII */
export function crc32(str: string, crc?: number) {
  if (!crc) crc = 0;
  let n = 0; // a number between 0 and 255
  let x = 0; // an hex number
  crc = crc ^ (-1); // eslint-disable-line
  for (let i = 0, iTop = str.length; i < iTop; i += 1) {
    n = ( crc ^ str.charCodeAt( i ) ) & 0xFF; // eslint-disable-line
    x = Number('0x' + table.substr( n * 9, 8 )); // eslint-disable-line
    crc = ( crc >>> 8 ) ^ x; // eslint-disable-line
  }
  return crc ^ (-1); // eslint-disable-line
}

export function saveNsfwFistFilter() {
  const path = join(getDefaultDataPath(), 'NSFW_FILTER_MARK');
  const buf = Buffer.alloc(0);
  write(path, buf);
}

export async function findNsfwFistFilter() {
  let success = false;
  const path = join(getDefaultDataPath(), 'NSFW_FILTER_MARK');
  try {
    success = await checkPathExist(path);
  } catch (error) {
    // empty
  }
  deleteDir(path);
  return success;
}
