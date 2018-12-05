import partial from 'lodash/partial';
import compose from 'lodash/fp/compose';
import { parse, toMS } from 'subtitle';

import { localLanguageLoder, localNameLoader, tagsGetter, loadLocalFile } from './utils';

const baseTags = { alignment: 2, pos: null };
const normalizer = parsedSubtitle => parsedSubtitle.map(subtitle => ({
  ...subtitle,
  start: toMS(subtitle.start) / 1000,
  end: toMS(subtitle.end) / 1000,
  tags: tagsGetter(subtitle.text, baseTags),
  text: subtitle.text.replace(/\{[^{}]*\}/g, ''),
}));

export default {
  name: 'SubRip',
  supportedFormats: ['srt'],
  infoLoaders: {
    language: partial(localLanguageLoder, 'srt'),
    name: {
      func: localNameLoader,
      params: ['src', 'videoName', 'language'],
    },
  },
  loader: loadLocalFile,
  parser: compose(normalizer, parse),
};
