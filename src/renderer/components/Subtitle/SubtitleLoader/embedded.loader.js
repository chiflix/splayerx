import { loadEmbeddedSubtitle, toArray, mediaHash } from './utils';
import { SubtitleError, ErrorCodes } from './errors';
import SubtitleLoader from './index';

async function embeddedIdLoader(videoSrc, streamIndex) {
  return `${videoSrc}-${(await mediaHash(videoSrc))}-${streamIndex}`;
}

function embeddedSubtitleParser(subtitleCodec, subtitleData) {
  const subtitleFormat = SubtitleLoader.codecToFormat(subtitleCodec);
  const loaderFiles = require.context('.', false, /\.loader\.js$/);
  const parser = loaderFiles.keys()
    .map(loaderFilename => loaderFiles(loaderFilename).default)
    .find(loader => toArray(loader.supportedFormats).includes(subtitleFormat))
    ?.parser;
  if (typeof parser === 'function') return parser(subtitleData);
  throw (new SubtitleError(ErrorCodes.SUBTITLE_INVALID_FORMAT, `Invalid Subtitle Format for embedded subtitle ${subtitleFormat}.`));
}

export default {
  longName: 'Embedded Subtitle',
  name: 'embedded',
  supportedFormats: 'embedded',
  id: {
    func: embeddedIdLoader,
    params: ['videoSrc', 'streamIndex'],
  },
  infoLoaders: {
    language: 'language',
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
