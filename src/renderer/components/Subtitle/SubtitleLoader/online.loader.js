import { tagsGetter, loadOnlineTranscript, normalizeCode } from './utils';

const baseTags = { alignment: 2, pos: null };
const normalizer = (parsedSubtitle) => {
  const finalDialogues = [];
  parsedSubtitle.forEach(({ startTime, endTime, text }) => {
    finalDialogues.push({
      start: startTime,
      end: endTime,
      text: text
        .replace(/[\\/][Nn]|\r?\n|\r/g, '\n') // replace soft and hard line breaks with \n
        .replace(/\\h/g, ' '), // replace hard space with space
      tags: tagsGetter(text, baseTags),
    });
  });
  return {
    info: {},
    dialogues: finalDialogues,
  };
};

export default {
  longName: 'Online Transcript',
  name: 'online',
  supportedFormats: ['online'],
  infoLoaders: {
    language: {
      func: normalizeCode,
      params: 'language',
    },
  },
  loader: loadOnlineTranscript,
  parser: normalizer,
};
