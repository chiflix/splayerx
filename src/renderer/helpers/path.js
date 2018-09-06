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

export default {
  filePathToUrl,
  fileUrlToPath,
};

