import { tagsGetter, loadOnlineTranscript } from './utils';

const baseTags = { alignment: 2, pos: null };
const normalizer = parsedSubtitle => parsedSubtitle.map(subtitle => ({
  start: subtitle[0],
  end: subtitle[1],
  text: subtitle[2].replace(/\{[^{}]*\}/g, ''),
  tags: tagsGetter(subtitle[2], baseTags),
}));

export default {
  longName: 'Online Transcript',
  name: 'online',
  supportedFormats: ['online'],
  id: 'src',
  infoLoaders: {
    language: 'language',
    name: 'name',
  },
  loader: loadOnlineTranscript,
  parser: normalizer,
};
