import flow from 'lodash/flow';
import { parse, toMS } from 'subtitle';

import { localLanguageLoader, localNameLoader, localIdLoader, tagsGetter, loadLocalFile } from './utils';

const baseTags = { alignment: 2, pos: null };
const normalizer = parsedSubtitle => parsedSubtitle.map(subtitle => ({
  info: {},
  dialogues: {
    ...subtitle,
    start: toMS(subtitle.start) / 1000,
    end: toMS(subtitle.end) / 1000,
    tags: tagsGetter(subtitle.text, baseTags),
    text: subtitle.text.replace(/\{[^{}]*\}/g, ''),
  },
}));

export default {
  longName: 'SubRip subtitle',
  name: 'subrip',
  supportedFormats: ['srt'],
  id: localIdLoader,
  infoLoaders: {
    language: {
      func: localLanguageLoader,
      params: ['src', 'format'],
    },
    name: localNameLoader,
  },
  loader: loadLocalFile,
  parser: flow(parse, normalizer),
};
