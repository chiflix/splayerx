import nzh from 'nzh';

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
        const p = nzh.cn.decodeS(a[4]);
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
