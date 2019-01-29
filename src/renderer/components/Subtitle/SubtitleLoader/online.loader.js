import { tagsGetter, loadOnlineTranscript, normalizeCode } from './utils';

const baseTags = { alignment: 2, pos: null };
const normalizer = parsedSubtitle => parsedSubtitle.map(({ startTime, endTime, text }) => ({
  start: startTime,
  end: endTime,
  text: text.replace(/\{[^{}]*\}/g, ''),
  tags: tagsGetter(text, baseTags),
}));

export default {
  longName: 'Online Transcript',
  name: 'online',
  supportedFormats: ['online'],
  id: 'src',
  infoLoaders: {
    language: {
      func: normalizeCode,
      params: 'language',
    },
  },
  loader: loadOnlineTranscript,
  parser: normalizer,
};
