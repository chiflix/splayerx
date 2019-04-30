export class SubtitleError extends Error {
  constructor(code, message) {
    // https://nodejs.org/api/errors.html
    // https://gist.github.com/slavafomin/b164e3e710a6fc9352c934b9073e7216
    // https://github.com/nodejs/node/blob/master/lib/internal/errors.js
    super(message);
    this.name = 'SubtitleError';
    Error.captureStackTrace(this, this.constructor);
    this.code = code;
  }
}

export const ErrorCodes = {
  SUBTITLE_NO_PERMISSIONS: 'ERR_SUBTITLE_NO_PERMISSIONS',
  SUBTITLE_NO_SUCH_FILE: 'ERR_SUBTITLE_NO_SUCH_FILE',
  SUBTITLE_RETRIEVE_FAILED: 'ERR_SUBTITLE_RETRIEVE_TIMEOUT',
  SUBTITLE_INVALID_TYPE: 'ERR_SUBTITLE_INVALID_TYPE',
  SUBTITLE_INVALID_FORMAT: 'ERR_SUBTITLE_INVALID_FORMAT',
  SUBTITLE_INVALID_CONTENT: 'ERR_SUBTITLE_INVALID_CONTENT',
  ENCODING_UNSUPPORTED_ENCODING: 'ERR_ENCODING_UNSUPPORTED_ENCODING',
};
