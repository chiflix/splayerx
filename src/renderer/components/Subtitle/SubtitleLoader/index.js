import { EventEmitter } from 'events';
import { localFormatLoader, toPromise, toArray, objectTo } from './utils';

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
    this.metaInfo = {
      format: type === 'online' ? 'online' : localFormatLoader(src),
    };
    const loader = Object.keys(loaders)
      .find(format => toArray(loaders[format].supportedFormats).includes(this.metaInfo.format));
    if (loaders[loader]) {
      this.loader = loaders[loader];
    } else {
      throw new Error('Unreconginzed format');
    }

    if (options) {
      this.options = options;
    }
  }

  async meta() {
    const { src, options } = this;
    const { infoLoaders: meta } = this.loader;
    let info;
    if (typeof meta === 'function') {
      info = await toPromise(meta, src);
    } else if (objectTo(meta) === 'option') {
      this.metaInfo.language = await toPromise(meta.language, src);
      this.metaInfo.name = await toPromise(meta.name, src);
    } else if (objectTo(meta) === 'function') {
      const { params, func } = meta;
      const realParams = [];
      params.forEach((param) => {
        realParams.push(this[param] || options[param] || undefined);
      });
      await toPromise(func, ...realParams);
    }
    this.metaInfo = info;
    this.emit('ready', this.metaInfo);
  }

  async load() {
    const { src } = this;
    const { load } = this.loader;
    this.data = load instanceof Promise ? await load(src) : load(src);
    if (this.data) this.emit('data');
  }

  async parse() {
    const { data } = this;
    const { parse } = this.loader;
    this.parsed = parse instanceof Promise ? await parse(data) : parse(data);
    if (this.parsed) this.$emit('parse');
  }
}
