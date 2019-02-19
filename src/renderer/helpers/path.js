/**
 * Convert a file path to file:// url.
 *
 * @param {string} filePath Absolute file path to be converted.
 * @returns
 */
export function filePathToUrl(filePath) {
  if (!filePath) throw new Error('filePath should not be empty');
  let fileUrl = filePath.replace(/\\/g, '/');
  if (!fileUrl.startsWith('/')) {
    fileUrl = `/${fileUrl}`;
  }
  fileUrl = encodeURI(`file://${fileUrl}`).replace(/#/g, '%23').replace(/[?]/g, '%3F');
  return fileUrl;
}


/**
 * Convert a file:// url to file path.
 *
 * @param {string} fileUrl To url to be converted.
 * @returns Absolute path of the file.
 */
export function fileUrlToPath(fileUrl) {
  if (!fileUrl) throw new Error('fileUrl should not be empty');
  let filePath = fileUrl.replace('file://', '').replace(/([?#].*)/g, '');
  filePath = decodeURI(filePath);
  if (process.platform === 'win32') {
    filePath = filePath.substr(1).replace(/\//g, '\\');
  }
  return filePath;
}

// season math reg
const SEREG = /([s|e](\d+)|(\d+)季|([零|一|二|三|四|五|六|七|八|九|十|百|千]+)季)/i;
// episode match reg
const EPREG = /([e|p](\d+)|(\d+)集|([零|一|二|三|四|五|六|七|八|九|十|百|千]+)集)/i;
// 分位数列表
const QUANTILES = ['千', '百', '十'];
// 中文数字匹配键值对
const ZHNMAP = {
  零: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

/**
 * 中文数字转换成阿拉伯数字，千分位以内
 * @description
 * @author tanghaixiang@xindong.com
 * @date 2019-02-19
 * @param {String} str 中文数字 example: '一千九百二十五'
 * @returns
 */
function zh2Numer(str) {
  if (Object.prototype.toString.call(str).toLowerCase() !== '[object string]') throw new Error('str should be String');
  let num = 0;
  const len = QUANTILES.length;
  QUANTILES.forEach((e, i) => {
    const tmpList = str.split(e);
    if (tmpList.length === 1) return;
    str = tmpList[1];
    if (ZHNMAP[tmpList[0]] !== undefined) {
      num += ZHNMAP[tmpList[0]] * (10 ** (len - i));
    }
  });
  if (ZHNMAP[str] !== undefined) {
    num += ZHNMAP[str];
  }
  return num;
}

/**
 * 匹配路径中视频文件名称里面的season和episode
 * @description
 * @author tanghaixiang@xindong.com
 * @date 2019-02-19
 * @export
 * @param {String} path 视频名称
 * @returns {Object} example: {season: null, episode: "02"}
 */
export function parseNameFromPath(path) {
  if (Object.prototype.toString.call(path).toLowerCase() !== '[object string]') throw new Error('path should be String');
  const ls = [null, null]; // [se, ep]
  const l = [SEREG, EPREG];
  l.forEach((r, i) => {
    path = path.trim().replace(r, (...a) => {
      if (a[2] || a[3]) { // match 第一个和第二个子项(\d+)
        const p = a[2] !== undefined ? parseInt(a[2], 10) : parseInt(a[3], 10);
        ls[i] = p < 10 ? `0${p}` : `${p}`;
        return '';
      }
      if (a[4]) { // match 第三个子项 中文字符
        const p = zh2Numer(a[4]);
        if (p > 0) ls[i] = p < 10 ? `0${p}` : `${p}`;
        return '';
      }
      if (a[0]) return a[0];
      return '';
    });
  });
  return {
    season: ls[0],
    episode: ls[1],
  };
}

export default {
  filePathToUrl,
  fileUrlToPath,
  parseNameFromPath,
};
