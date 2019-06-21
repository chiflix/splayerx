import flow from 'lodash/flow';
import { parse, toMS } from 'subtitle';

import {
  localLanguageLoader, localNameLoader, tagsGetter, loadLocalFile,
} from './utils';

const baseTags = { alignment: 2, pos: null };
const normalizer = (parsedSubtitle) => {
  const finalDialogues = [];
  parsedSubtitle.forEach((subtitle) => {
    finalDialogues.push({
      start: toMS(subtitle.start) / 1000,
      end: toMS(subtitle.end) / 1000,
      tags: tagsGetter(subtitle.text, baseTags),
      text: subtitle.text.replace(/\{[^{}]*\}/g, '').replace(/[\\/][Nn]|\r?\n|\r/g, '\n'),
    });
  });
  return {
    info: {},
    dialogues: finalDialogues,
  };
};


export default {
  longName: 'SubRip subtitle',
  name: 'subrip',
  supportedFormats: ['srt'],
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
