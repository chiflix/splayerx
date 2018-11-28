import { existsSync, readFile } from 'fs';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import { EventEmitter } from 'events';

import { parse as srtVttParser } from 'subtitle';
import { parse as assParser } from 'ass-compiler';

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
      resolve(iconv.decode(data, encoding));
    }
    reject(new Error(`Unsupported encoding: ${encoding}.`));
  });
});
const onlineSubtitleGetter = hash => Sagi.getTranscript(hash);

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
      subtitleGetter(src).then((subtitle) => {
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
    let parser;
    switch (type) {
      default:
        break;
      case 'ass':
      case 'ssa':
        parser = assParser;
        break;
      case 'srt':
      case 'vtt':
        parser = srtVttParser;
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
