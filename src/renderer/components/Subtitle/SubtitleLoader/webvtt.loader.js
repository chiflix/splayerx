import partial from 'lodash/partial';
import compose from 'lodash/fp/compose';
import { parse, toMS } from 'subtitle';

import { localLanguageLoder, localNameLoader, loadLocalFile } from './utils';

const baseTags = {
  // https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API#Cue_settings
  vertical: '',
  line: '',
  position: '',
  // size: '',
  // align: '',
};
const normalizer = parsedSubtitle => parsedSubtitle.map(subtitle => ({
  ...subtitle,
  start: toMS(subtitle.start) / 1000,
  end: toMS(subtitle.end) / 1000,
  text: subtitle.text.replace(/\{[^{}]*\}/g, ''),
  tags: !subtitle.settings ? baseTags : {
    ...baseTags,
    ...subtitle.split(' ').reduce((accu, curr) => ({ ...accu, [curr.split(':')[0]]: curr.split(':')[1] }), {}),
  },
}));

export default {
  name: 'WebVTT',
  supportedFormats: ['vtt'],
  infoLoaders: {
    language: partial(localLanguageLoder, 'vtt'),
    name: localNameLoader,
  },
  loader: loadLocalFile,
  parser: compose(normalizer, parse),
};
