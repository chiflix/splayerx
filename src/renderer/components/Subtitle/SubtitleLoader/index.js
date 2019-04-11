import { EventEmitter } from 'events';
import { existsSync } from 'fs';
import flatten from 'lodash/flatten';
import cloneDeep from 'lodash/cloneDeep';
import { storeSubtitle } from '@/helpers/subtitle';
import { localFormatLoader, castArray, promisify, functionExtraction, generateTrack, megreSameTime, detectEncodingFromFileSync, embeddedSrcLoader } from './utils';
import { SubtitleError, ErrorCodes } from './errors';
import { NOT_SUPPORTED_SUBTITLE } from '../../../../shared/notificationcodes';

const files = require.context('.', false, /\.loader\.js$/);
const loaders = {};

files.keys().forEach((key) => {
  loaders[key.replace(/(\.\/|\.loader|\.js)/g, '')] = files(key).default;
});

const supportedFormats = flatten(Object.keys(loaders)
  .map(loaderType => loaders[loaderType].supportedFormats));

const supportedCodecs = flatten(Object.keys(loaders)
  .map(loaderType => [loaders[loaderType].name, loaders[loaderType].longName]));

export default class SubtitleLoader extends EventEmitter {
  static supportedFormats = supportedFormats;
  static supportedCodecs = supportedCodecs;
  static codecToFormat(codec) {
    return Object.values(loaders).filter(loader => new RegExp(`${codec}`).test(loader.name))[0].supportedFormats[0];
  }
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
      // if (!type || ['local', 'embedded', 'online', 'modified'].indexOf(type) === -1) {
      //   helpers.methods.addLog('error', {
      //     message: 'Unsupported Subtitle .',
      //     errcode: 'NOT_SUPPORTED_SUBTITLE',
      //   });
      //   throw new SubtitleError(ErrorCodes.SUBTITLE_INVALID_TYPE,
      //     `Unknown subtitle type ${type}.`);
      // }
      // this.type = type;
      // format validator (mainly for local subtitle)
      const format = type === 'local' ? localFormatLoader(src) : type;
      if (supportedFormats.includes(format)) {
        this.metaInfo.format = format;
        if (format === 'embedded' && options.codec) {
          this.metaInfo.codecFormat = SubtitleLoader.codecToFormat(options.codec);
        }
        this.loader = Object.values(loaders)
          .find(loader => castArray(loader.supportedFormats).includes(format));
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
        case 'modified':
          break;
        case 'local': {
          if (existsSync(src)) this.metaInfo.encoding = detectEncodingFromFileSync(src);
          break;
        }
      }
      this.type = type.toLowerCase();
      this.options = options || {};
      this.data = this.options.data; // set data for stored online subtitles
      // 如果是自制字幕，就不需要解析了，因为自制字幕在存储的时候都是
      // 把内存中的数组以JSON的形式存在缓存目录下,JSON包含字幕的meta和dialogues
      if (this.type === 'modified') {
        this.data = '**';
        this.metaInfo = cloneDeep(this.options.storage.metaInfo);
        this.referenceSubtitleId = this.options.storage.referenceSubtitleId;
      }
      this.videoSrc = this.options.videoSrc; // set videoSrc

      // subtitle id
      if (this.options.id) {
        this.id = this.options.id.toString();
        setImmediate(() => this.emit('loading', this.id));
        if (this.type === 'modified') {
          // 在往indexBD存自制字幕的时候，存储成功可以直接发送meta-change
          // meta数组也是存在文件里面的
          const { name, language } = this.metaInfo;
          setImmediate(() => this.emit('meta-change', { field: 'name', value: name }));
          setImmediate(() => this.emit('meta-change', { field: 'language', value: language }));
        }
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
          if (this.type === 'modified') {
            // 在往indexBD存自制字幕的时候，存储成功可以直接发送meta-change
            // meta数组也是存在文件里面的
            const { name, language } = this.metaInfo;
            setImmediate(() => this.emit('meta-change', { field: 'name', value: name }));
            setImmediate(() => this.emit('meta-change', { field: 'language', value: language }));
          }
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
      if (this.data) this.emit('data', this.data);
      else {
        const loader = functionExtraction(this.loader.loader);
        this.data =
          await promisify(loader.func.bind(this, ...this._getParams(castArray(loader.params))));
        this.emit('data', this.data);
      }
    } catch (e) {
      this.fail.bind(this)(e);
    }
  }

  async parse() {
    try {
      if (this.type === 'modified' && this.options.storage.parsed) {
        // 如果是自制字幕不需要parse了，可以直接取存在storage里面的数据
        this.parsed = cloneDeep(this.options.storage.parsed);
        delete this.options.storage;
        // try {
        //   // 自制字幕就不需要处理dialogues了
        //   megreSameTime(this.parsed.dialogues, this.metaInfo.format);
        //   generateTrack(this.parsed.dialogues, this.metaInfo.format);
        // } catch (err) {
        //   console.log(err);
        // }
        this.emit('parse', this.parsed);
      } else {
        const parser = functionExtraction(this.loader.parser, 'data');
        this.parsed =
          await promisify(parser.func.bind(null, ...this._getParams(castArray(parser.params))));
        try {
          // 先合并相同字幕
          megreSameTime(this.parsed.dialogues, this.metaInfo.format);
          // 过滤字幕生成对应的轨道
          generateTrack(this.parsed.dialogues, this.metaInfo.format);
        } catch (err) {
          console.log(err);
        }
        this.emit('parse', this.parsed);
      }
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
