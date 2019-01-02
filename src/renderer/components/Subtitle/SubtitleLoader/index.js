import { EventEmitter } from 'events';
import flatten from 'lodash/flatten';
import { localFormatLoader, toArray, mediaHash, promisify, functionExtraction } from './utils';

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
  /**
   * Create a SubtitleLoader
   * @param {string} src - path for a local/embedded online or hash for an online subtitle
   * @param {string} type - 'local', 'embedded' or 'online'
   * @param {object} options - (optional)other info about subtitle,
   * like language or name(for online subtitle)
   */
  constructor(src, type, options) {
    super();
    switch (type.toLowerCase()) {
      case 'local': {
        this.src = src;
        this.type = type.toLowerCase();
        this.format = localFormatLoader(src);
        break;
      }
      case 'embedded': {
        this.src = src;
        this.type = type.toLowerCase();
        this.format = 'embedded';
        break;
      }
      case 'online': {
        this.src = src;
        this.type = type.toLowerCase();
        this.format = 'online';
        break;
      }
      default:
        throw new Error('Invalid Subtitle Type');
    }

    this.options = options || {};
    const loader = Object.keys(loaders)
      .find(format => toArray(loaders[format].supportedFormats).includes(this.format));
    if (loaders[loader]) {
      this.loader = loaders[loader];
    } else {
      throw new Error('Unreconginzed format');
    }
  }

  static supportedFormats = supportedFormats;
  static supportedCodecs = supportedCodecs;

  static codecToFormat(codec) {
    return Object.values(loaders).filter(loader => new RegExp(`${codec}`).test(loader.name))[0].supportedFormats[0];
  }

  async meta() {
    const {
      src, type, format, options,
    } = this;
    this.mediaHash = type === 'local' ? await mediaHash(src) : src;
    this.id = type === 'online' ? src : this.mediaHash;
    const { infoLoaders: rawInfoLoader } = this.loader;
    const info = {
      src,
      type,
      format,
      id: this.id,
    };
    const getParams = params => params.map(param => (
      this[param] || options[param] || info[param]
    ));
    const infoLoaders = functionExtraction(rawInfoLoader); // normalize all info loaders
    const infoTypes = Object.keys(infoLoaders); // get all info types
    const infoResults = await Promise.all(infoTypes // make all infoLoaders promises and Promise.all
      .map(infoType => promisify(infoLoaders[infoType].func
        .bind(null, ...getParams(toArray(infoLoaders[infoType].params))))));
    infoTypes.forEach((infoType, index) => { // normalize all info
      info[infoTypes[index]] = infoResults[index] instanceof Error ? '' : infoResults[index];
    });
    this.metaInfo = { ...info, format };
    this.emit('ready', this.metaInfo);
  }

  async load() {
    const { loader: rawLoader } = this.loader;
    const getParams = params => params.map(param => (
      this[param] || this.metaInfo[param] || this.options[param]
    ));
    const loader = functionExtraction(rawLoader);
    this.data = await promisify(loader.func.bind(null, ...getParams(toArray(loader.params))));
    this.emit('data', this.data);
  }

  async parse() {
    const { parser: rawParser } = this.loader;
    const getParams = params => params.map(param => (
      this[param] || this.metaInfo[param] || this.options[param]
    ));
    const parser = functionExtraction(rawParser, 'data');
    this.parsed = await promisify(parser.func.bind(null, ...getParams(toArray(parser.params))));
    this.emit('parse', this.parsed);
  }
}
