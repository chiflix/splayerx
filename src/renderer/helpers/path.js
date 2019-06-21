import nzh from 'nzh';

/**
 * Convert a file path to file:// url.
 *
 * @param {string} filePath Absolute file path to be converted.
 * @returns
 */
export function filePathToUrl(filePath) {
  if (!filePath) return '';
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
export function fileUrlToPath(fileUrl, { platform } = { platform: process.platform }) {
  if (!fileUrl) throw new Error('fileUrl should not be empty');
  let filePath = fileUrl.replace('file://', '').replace(/([?#].*)/g, '');
  filePath = decodeURI(filePath);
  if (platform === 'win32') {
    filePath = filePath.substr(1).replace(/\//g, '\\');
  }
  return filePath;
}

// season math reg
const SEREG = /([\u005b.-\s_]s[e]?(\d+)|season(\d+)|第(\d+)季|第([零一二三四五六七八九十百千]+)季)/i;
// episode match reg
const EPREG = /(e[p]?(\d+)[\u005d.-\s_]?|episode(\d+)|第(\d+)集|第([零一二三四五六七八九十百千]+)集)/i;

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
  path = path.trim().replace(/\.(\w+)$/i, '.');
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

export default {
  filePathToUrl,
  fileUrlToPath,
  parseNameFromPath,
};
