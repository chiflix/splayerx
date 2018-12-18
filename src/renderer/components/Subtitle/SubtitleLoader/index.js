import { EventEmitter } from 'events';
import { localFormatLoader, toArray, mediaHash, promisify } from './utils';

const files = require.context('.', false, /\.loader\.js$/);
const loaders = {};

files.keys().forEach((key) => {
  loaders[key.replace(/(\.\/|\.loader|\.js)/g, '')] = files(key).default;
});

export default class SubtitleLoader extends EventEmitter {
  constructor(src, type, options) {
    super();
    this.src = src;
    this.type = type;
    this.format = type === 'online' ? 'online' : localFormatLoader(src);
    this.options = options || {};
    const loader = Object.keys(loaders)
      .find(format => toArray(loaders[format].supportedFormats).includes(this.format));
    if (loaders[loader]) {
      this.loader = loaders[loader];
    } else {
      throw new Error('Unreconginzed format');
    }
  }

  async meta() {
    const {
      src, type, format, options,
    } = this;
    this.mediaHash = type !== 'online' ? await mediaHash(src) : src;
    const { infoLoaders: meta } = this.loader;
    let info = {
      src,
      type,
      format,
      id: type === 'online' ? src : this.mediaHash,
    };
    if (typeof meta === 'function') {
      info = await Promise.resolve(meta.call(null, src));
    } else if (typeof meta === 'object') {
      const getParams = (params, info) => params.map(param => (
        this[param] || options[param] || info[param]
      ));
      const infoTypes = Object.keys(meta);
      const infoResults = await Promise.all(infoTypes
        .map((infoType) => {
          const infoLoader = meta[infoType];
          if (typeof infoLoader === 'function') return promisify(infoLoader.bind(null, src));
          if (typeof infoLoader === 'string') return promisify(() => getParams(toArray(infoLoader))[0]);
          return promisify(infoLoader.func.bind(null, ...getParams(toArray(infoLoader.params))));
        }).map(promise => promise.catch(err => err)));
      infoTypes.forEach((infoType, index) => {
        info[infoTypes[index]] = infoResults[index] instanceof Error ? '' : infoResults[index];
      });
    }
    this.metaInfo = { ...info, format, id: type === 'online' ? src : this.mediaHash };
    this.emit('ready', this.metaInfo);
  }

  async load() {
    const { src } = this;
    const { load } = this.loader;
    this.data = await promisify(load.bind(null, src));
    this.emit('data', this.data);
  }

  async parse() {
    const { data } = this;
    const { parse } = this.loader;
    this.parsed = await promisify(parse.bind(null, data));
    this.emit('parse', this.parsed);
  }
}
