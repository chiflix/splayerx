import { EventEmitter } from 'events';
import { existsSync } from 'fs';
import { storeSubtitle } from '@/helpers/subtitle';
import {
  supportedFormats, supportedCodecs, codecToFormat, getLoader,
  castArray, promisify, functionExtraction,
  localFormatLoader, detectEncodingFromFileSync, embeddedSrcLoader,
} from './utils';
import { SubtitleError, ErrorCodes } from './errors';
import { NOT_SUPPORTED_SUBTITLE } from '../../../../shared/notificationcodes';


export default class SubtitleLoader extends EventEmitter {
  static supportedFormats = supportedFormats;

  static supportedCodecs = supportedCodecs;

  static codecToFormat = codecToFormat;

  metaInfo = new Proxy({}, {
    set: (target, field, value) => {
      const oldVal = Reflect.get(target, field);
      const success = Reflect.set(target, field, value);
      const newVal = Reflect.get(target, field);
      if (newVal !== value) return false;
      if (success && oldVal !== newVal) this.emit('meta-change', { field, value });
      return true;
    },
  })

  _getParams(params) {
    return castArray(params)
      .map(param => this[param] || this.metaInfo[param] || this.options[param]);
  }

  /**
   * Create a SubtitleLoader
   * @param {string} src - path for a local subtitle
   * , an embedded stream index or hash for an online subtitle
   * @param {string} type - 'local', 'embedded' or 'online' or 'test'
   * @param {object} options - (optional)other info about subtitle,
   * like language or name(for online subtitle)
   */
  // eslint-disable-next-line complexity
  constructor(src, type, options) {
    super();
    try {
      this.src = src;

      // format validator (mainly for local subtitle)
      const format = type === 'local' ? localFormatLoader(src) : type;
      if (supportedFormats.includes(format)) {
        this.metaInfo.format = format;
        if (format === 'embedded' && options.codec) {
          this.metaInfo.codecFormat = SubtitleLoader.codecToFormat(options.codec);
        }
        this.loader = getLoader(format);
      } else {
        throw new SubtitleError(ErrorCodes.SUBTITLE_INVALID_FORMAT, `Unknown subtitle format for subtitle ${src}.`);
      }

      // type validator (src and encoding validators for local subtitle)
      switch (type.toLowerCase()) {
        default:
          throw new SubtitleError(ErrorCodes.SUBTITLE_INVALID_TYPE, `Unknown subtitle type ${type}.`);
        case 'embedded':
        case 'online':
          break;
        case 'local': {
          if (existsSync(src)) this.metaInfo.encoding = detectEncodingFromFileSync(src);
          break;
        }
      }
      this.type = type.toLowerCase();

      this.options = options || {};
      this.data = this.options.data; // set data for stored online subtitles
      this.videoSrc = this.options.videoSrc; // set videoSrc

      // subtitle id
      if (this.options.id) {
        this.id = this.options.id.toString();
        setImmediate(() => this.emit('loading', this.id));
      } else if (this.type === 'embedded') {
        embeddedSrcLoader(options.videoSrc, src, this.metaInfo.codecFormat)
          .then((embeddedSrc) => {
            this.options.src = embeddedSrc;
            this.metaInfo.encoding = detectEncodingFromFileSync(embeddedSrc);
            return storeSubtitle({
              src: this.src,
              type: this.type,
              format: this.metaInfo.codecFormat,
            });
          })
          .then((id) => {
            this.id = id.toString();
            setImmediate(() => this.emit('loading', id));
          })
          .catch(this.fail);
      } else {
        storeSubtitle({
          src: this.src,
          type: this.type,
          format: this.metaInfo.format,
        }).then((id) => {
          this.id = id.toString();
          setImmediate(() => this.emit('loading', id));
        });
      }
    } catch (err) {
      this.fail.bind(this)(err);
    }
  }

  async meta() {
    try {
      const { metaInfo } = this;
      const infoLoaders = functionExtraction(this.loader.infoLoaders); // normalize all info loaders
      const infoTypes = Object.keys(infoLoaders); // get all info types
      const infoResults = await
      Promise.all(infoTypes // make all infoLoaders promises and Promise.all
        .map(infoType => promisify(infoLoaders[infoType].func
          .bind(null, ...this._getParams(infoLoaders[infoType].params)))));
      infoTypes.forEach((infoType, index) => { // normalize all info
        metaInfo[infoTypes[index]] = infoResults[index] instanceof Error ? '' : infoResults[index];
      });
      this.emit('ready', metaInfo);
    } catch (e) {
      this.fail.bind(this)(e);
    }
  }

  async load() {
    try {
      const loader = functionExtraction(this.loader.loader);
      if (this.data) this.emit('data', this.data);
      else {
        this.data = await promisify(loader.func.bind(
          this,
          ...this._getParams(castArray(loader.params)),
        ));
        this.emit('data', this.data);
      }
    } catch (e) {
      this.fail.bind(this)(e);
    }
  }

  async parse() {
    try {
      const parser = functionExtraction(this.loader.parser, 'data');
      this.parsed = await promisify(parser.func.bind(
        null,
        ...this._getParams(castArray(parser.params)),
      ));
      this.emit('parse', this.parsed);
    } catch (e) {
      this.fail.bind(this)(e);
    }
  }

  fail(error) {
    console.log('SubtitleError:', error);
    this.emit('failed', {
      error,
      bubble: NOT_SUPPORTED_SUBTITLE,
    });
  }
}
