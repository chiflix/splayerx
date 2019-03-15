import { normalizeCode } from './utils';

export default {
  longName: 'Modified Transcript',
  name: 'modified',
  supportedFormats: ['modified'],
  infoLoaders: {
    language: {
      func: normalizeCode,
      params: 'language',
    },
  },
  parser: null,
};
