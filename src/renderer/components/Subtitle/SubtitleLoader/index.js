import { EventEmitter } from 'events';
import flatten from 'lodash/flatten';
import helpers from '@/helpers';
import { localFormatLoader, toArray, promisify, functionExtraction } from './utils';
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
    return toArray(params).map(param => this[param] || this.metaInfo[param] || this.options[param]);
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

    if (!type || ['local', 'embedded', 'online'].indexOf(type) === -1) {
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
        .find(loader => toArray(loader.supportedFormats).includes(format));
    } else {
      helpers.methods.addLog('error', {
        message: 'Unsupported Subtitle .',
        errcode: 'NOT_SUPPORTED_SUBTITLE',
      });
      throw new SubtitleError(ErrorCodes.SUBTITLE_INVALID_FORMAT, `Unknown subtitle format for subtitle ${src}.`);
    }

    this.options = options || {};

    const { func: idLoader, params: idParams } = functionExtraction(this.loader.id);
    promisify(idLoader.bind(null, ...this._getParams(idParams))).then((id) => {
      this.id = id;
      this.emit('loading', id);
    });
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
    const loader = functionExtraction(this.loader.loader);
    this.data = await promisify(loader.func.bind(null, ...this._getParams(toArray(loader.params))));
    this.emit('data', this.data);
  }

  async parse() {
    try {
      const parser = functionExtraction(this.loader.parser, 'data');
      this.parsed =
        await promisify(parser.func.bind(null, ...this._getParams(toArray(parser.params))));
      this.emit('parse', this.parsed);
    } catch (e) {
      helpers.methods.addLog('error', {
        message: 'Unsupported Subtitle .',
        errcode: 'NOT_SUPPORTED_SUBTITLE',
      });
      throw e;
    }
  }
}
