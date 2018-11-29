import { existsSync, readFile } from 'fs';
import { extname } from 'path';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import { EventEmitter } from 'events';
import pick from 'lodash/pick';
import compose from 'lodash/fp/compose';

import { parse as srtVttParser, toMS } from 'subtitle';
import { compile as assParser } from 'ass-compiler';

import Sagi from '@/helpers/sagi';

const getSubtitleType = (src) => {
  if (existsSync(src)) {
    return 'local';
  } else if (/^[a-f0-9]*/i.test(src)) { // need to know subtitle hash pattern
    return 'online';
  }
  return 'unknown';
};
const localSubtitleGetter = path => new Promise((resolve, reject) => {
  readFile(path, (err, data) => {
    if (err) reject(err);
    const encoding = chardet.detect(data.slice(0, 100));
    if (iconv.encodingExists(encoding)) {
      resolve([iconv.decode(data, encoding), extname(path).slice(1)]);
    }
    reject(new Error(`Unsupported encoding: ${encoding}.`));
  });
});
const onlineSubtitleGetter = async hash => [(await Sagi.getTranscript(hash)).array[1], 'online'];
const tagsGetter = (text, baseTags) => {
  const tagRegex = /\{[^{}]*\}/g;
  const matchTags = text.match(tagRegex);
  const finalTags = { ...baseTags };
  if (matchTags instanceof Array) {
    const tagGetters = {
      an: tag => ({ alignment: Number.parseFloat(tag.match(/\d/g)[0]) }),
      pos: (tag) => {
        const coords = tag.match(/\((.*)\)/)[1].split(',');
        return ({
          pos: {
            x: Number.parseFloat(coords[0]),
            y: Number.parseFloat(coords[1]),
          },
        });
      },
    };
    /* eslint-disable no-restricted-syntax */
    for (let tag of matchTags) {
      tag = tag.replace(/[{}\\/]/g, '');
      Object.keys(tagGetters).forEach((getterType) => {
        if (tag.startsWith(getterType)) {
          Object.assign(finalTags, tagGetters[getterType](tag));
        }
      });
    }
  }
  return finalTags;
};
const assBaseTags = {
  // fn: '',
  // fs: '',
  // c1: '',
  // a1: '',
  // c2: '',
  // a2: '',
  // c3: '',
  // a3: '',
  // c4: '',
  // a4: '',
  b: 0,
  i: 0,
  u: 0,
  s: 0,
  // fscx: 100,
  // fscy: 100,
  // fsp: 0,
  // frz: 0,
  // xbord: 2,
  // ybord: 2,
  // xshad: 2,
  // yshad: 2,
  // q: 0,
  alignment: 2,
  pos: null,
};
const vttBaseTags = {
  // https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API#Cue_settings
  vertical: '',
  line: '',
  position: '',
  // size: '',
  // align: '',
};
const srtBaseTags = {
  alignment: 2,
  pos: null,
};
const onlineBaseTags = {
  alignment: 2,
  pos: null,
};
const assNormalizer = (parsedSubtitle) => {
  const finalSubtitles = [];
  const { dialogues } = parsedSubtitle;
  dialogues.forEach((dialogue) => {
    const {
      start, end, alignment, slices, pos,
    } = dialogue;
    const baseDiagolue = {
      start, end,
    };
    /* eslint-disable no-restricted-syntax */
    for (const slice of slices) {
      const { tag: sliceTag, fragments } = slice;
      for (const fragment of fragments) {
        const { tag: fragmentTag, text } = fragment;
        const finalTags = {
          ...assBaseTags,
          alignment,
          pos,
          ...pick(Object.assign({}, sliceTag, fragmentTag), ['b', 'i', 'u', 's']),
        };
        const finalDiagolue = Object.assign(
          {},
          baseDiagolue,
          { text: text.replace(/[\\/][Nn]/g, ''), tags: finalTags },
        );
        finalSubtitles.push(finalDiagolue);
      }
    }
  });
  return finalSubtitles;
};
const srtNormalizer = parsedSubtitle => parsedSubtitle.map(subtitle => ({
  ...subtitle,
  start: toMS(subtitle.start) / 1000,
  end: toMS(subtitle.end) / 1000,
  tags: tagsGetter(subtitle.text, srtBaseTags),
  text: subtitle.text.replace(/\{[^{}]*\}/g, ''),
}));
const vttNormalizer = parsedSubtitle => parsedSubtitle.map(subtitle => ({
  ...subtitle,
  start: toMS(subtitle.start) / 1000,
  end: toMS(subtitle.end) / 1000,
  text: subtitle.text.replace(/\{[^{}]*\}/g, ''),
  tags: !subtitle.settings ? vttBaseTags : {
    ...vttBaseTags,
    ...subtitle.split(' ').reduce((accu, curr) => ({ ...accu, [curr.split(':')[0]]: curr.split(':')[1] }), {}),
  },
}));
const onlineNormalizer = parsedSubtitle => parsedSubtitle.map(subtitle => ({
  start: subtitle[0],
  end: subtitle[1],
  text: subtitle[2].replace(/\{[^{}]*\}/g, ''),
  tags: tagsGetter(subtitle[2], onlineBaseTags),
}));

class Subtitle extends EventEmitter {
  constructor(src) {
    super();
    const type = getSubtitleType(src);
    if (type === 'unknown') {
      this.emit('error', 'ERR_UNKNOWN_SUBTITLE_TYPE.');
    } else {
      this.metaInfo = {
        type,
        src,
      };
      this.emit('ready', this.metaInfo);
    }
  }

  load() {
    const { type, src } = this.metaInfo;
    let subtitleGetter;
    if (type === 'local') {
      subtitleGetter = localSubtitleGetter;
    } else if (type === 'online') {
      subtitleGetter = onlineSubtitleGetter;
    }

    if (subtitleGetter) {
      subtitleGetter(src).then((result) => {
        const [subtitle, type] = result instanceof Array ? result : [result];
        if (type) this.metaInfo.type = type;
        this.rawData = subtitle;
        this.emit('data', this.rawData);
        this.parse();
      }).catch((error) => {
        this.emit('error', error);
      });
    }
  }

  parse() {
    const { type } = this.metaInfo;
    let parser = subtitle => subtitle;
    switch (type) {
      default:
        break;
      case 'ass':
      case 'ssa':
        parser = compose(assNormalizer, assParser);
        break;
      case 'srt':
        parser = compose(srtNormalizer, srtVttParser);
        break;
      case 'vtt':
        parser = compose(vttNormalizer, srtVttParser);
        break;
      case 'online':
        parser = onlineNormalizer;
        break;
    }
    try {
      this.parsedData = parser(this.rawData);
      this.emit('parse', this.parsedData);
    } catch (error) {
      this.emit('error', error);
    }
  }
}

export default Subtitle;
