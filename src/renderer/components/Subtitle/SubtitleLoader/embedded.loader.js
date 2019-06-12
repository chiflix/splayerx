import {
  loadEmbeddedSubtitle, castArray, normalizeCode, get,
} from './utils';
import { SubtitleError, ErrorCodes } from './errors';
import SubtitleLoader from './index';

function embeddedSubtitleParser(subtitleCodec, subtitleData) {
  const subtitleFormat = SubtitleLoader.codecToFormat(subtitleCodec);
  const loaderFiles = require.context('.', false, /\.loader\.js$/);
  const parser = get(
    loaderFiles.keys()
      .map(loaderFilename => loaderFiles(loaderFilename).default)
      .find(loader => castArray(loader.supportedFormats).includes(subtitleFormat)),
    'parser',
  );
  if (typeof parser === 'function') return parser(subtitleData);
  throw (new SubtitleError(ErrorCodes.SUBTITLE_INVALID_FORMAT, `Invalid Subtitle Format for embedded subtitle ${subtitleFormat}.`));
}

export default {
  longName: 'Embedded Subtitle',
  name: 'embedded',
  supportedFormats: 'embedded',
  infoLoaders: {
    language: {
      func: normalizeCode,
      params: 'language',
    },
    name: 'name',
  },
  loader: {
    func: loadEmbeddedSubtitle,
    params: ['videoSrc', 'src', 'codec'],
  },
  parser: {
    func: embeddedSubtitleParser,
    params: ['codec', 'data'],
  },
};
