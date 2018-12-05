import { tagsGetter, loadOnlineTranscript, loadOnlineTranscriptInfo } from './utils';

const baseTags = { alignment: 2, pos: null };
const normalizer = parsedSubtitle => parsedSubtitle.map(subtitle => ({
  start: subtitle[0],
  end: subtitle[1],
  text: subtitle[2].replace(/\{[^{}]*\}/g, ''),
  tags: tagsGetter(subtitle[2], baseTags),
}));

export default {
  name: 'Online Transcript',
  supportedFormats: ['online'],
  infoLoaders: {
    func: loadOnlineTranscriptInfo,
    params: ['src', 'mediaHash'],
  },
  load: loadOnlineTranscript,
  parse: normalizer,
};
