import { EventEmitter } from 'events';
import flatten from 'lodash/flatten';
import helpers from '@/helpers';
import { storeSubtitle } from '@/helpers/subtitle';
import { localFormatLoader, castArray, promisify, functionExtraction } from './utils';
import { SubtitleError, ErrorCodes } from './errors';

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
  constructor(src, type, options) {
    super();
    this.src = src; // to-do: src validator

    if (!type || ['local', 'embedded', 'online', 'modified'].indexOf(type) === -1) {
      helpers.methods.addLog('error', {
        message: 'Unsupported Subtitle .',
        errcode: 'NOT_SUPPORTED_SUBTITLE',
      });
      throw new SubtitleError(ErrorCodes.SUBTITLE_INVALID_TYPE, `Unknown subtitle type ${type}.`);
    }
    this.type = type;

    const format = type === 'local' ? localFormatLoader(src) : type;
    if (supportedFormats.includes(format)) {
      this.metaInfo.format = format;
      this.loader = Object.values(loaders)
        .find(loader => castArray(loader.supportedFormats).includes(format));
    } else {
      helpers.methods.addLog('error', {
        message: 'Unsupported Subtitle .',
        errcode: 'NOT_SUPPORTED_SUBTITLE',
      });
      throw new SubtitleError(ErrorCodes.SUBTITLE_INVALID_FORMAT, `Unknown subtitle format for subtitle ${src}.`);
    }

    this.options = options || {};
    this.data = this.options.data;
    // 如果是自制字幕，就不需要解析了，因为自制字幕在存储的时候都是
    // 把内存中的数组以JSON的形式存在缓存目录下,JSON包含字幕的meta和dialogues
    if (this.type === 'modified') {
      this.data = '**';
      this.metaInfo = this.options.storage.metaInfo;
    }

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
      this.emit('failed', this.id);
      throw e;
    }
  }

  async load() {
    if (this.data) this.emit('data', this.data);
    else {
      const loader = functionExtraction(this.loader.loader);
      this.data =
        await promisify(loader.func.bind(this, ...this._getParams(castArray(loader.params))));
      this.emit('data', this.data);
    }
  }

  async parse() {
    try {
      if (this.type === 'modified' && this.options.storage.parsed) {
        // 如果是自制字幕不需要parse了，可以直接取存在storage里面的数据
        this.parsed = this.options.storage.parsed;
        this.emit('parse', this.parsed);
      } else {
        const parser = functionExtraction(this.loader.parser, 'data');
        this.parsed =
          await promisify(parser.func.bind(null, ...this._getParams(castArray(parser.params))));
        this.emit('parse', this.parsed);
      }
    } catch (e) {
      helpers.methods.addLog('error', {
        message: 'Unsupported Subtitle .',
        errcode: 'NOT_SUPPORTED_SUBTITLE',
      });
      throw e;
    }
  }
}
