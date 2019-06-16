import flow from 'lodash/flow';
import { parse, toMS } from 'subtitle';

import { localLanguageLoader, localNameLoader, loadLocalFile } from './utils';

const baseTags = {
  // https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API#Cue_settings
  vertical: '',
  line: '',
  position: '',
  // size: '',
  // align: '',
};
const normalizer = (parsedSubtitle) => {
  const finalDialogues = [];
  parsedSubtitle.forEach((subtitle) => {
    finalDialogues.push({
      start: toMS(subtitle.start) / 1000,
      end: toMS(subtitle.end) / 1000,
      text: subtitle.text.replace(/\{[^{}]*\}/g, '').replace(/[\\/][Nn]|\r?\n|\r/g, '\n'),
      tags: !subtitle.settings ? baseTags : {
        ...baseTags,
        ...subtitle.split(' ').reduce((accu, curr) => ({ ...accu, [curr.split(':')[0]]: curr.split(':')[1] }), {}),
      },
    });
  });
  return {
    info: {},
    dialogues: finalDialogues,
  };
};

export default {
  longName: 'WebVTT subtitle',
  name: 'webvtt',
  supportedFormats: ['vtt'],
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
