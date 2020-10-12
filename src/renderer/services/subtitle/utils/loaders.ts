import { dirname, join, extname } from 'path';
import {
  ensureDirSync, existsSync, copyFile, outputFile, readFile,
} from 'fs-extra';
import { EventEmitter } from 'events';
import {
  ILoader, IOrigin, Type, Format,
} from '@/interfaces/ISubtitle';
import { SUBTITLE_FULL_DIRNAME } from '@/constants';
import { mediaQuickHash } from '@/libs/utils';
import Sagi from '@/libs/sagi';
import {
  getSubtitleMetadata, cacheSubtitle, getSubtitleFragment, finishSubtitleExtraction,
} from '@/plugins/mediaTasks';
import { SagiTextSubtitlePayload } from '../parsers';
import { sagiSubtitleToWebVTT } from './transcoders';
import { loadLocalFile, formatToExtension } from '.';

enum Status {
  NOT_STARTED,
  WORKING,
  FINISHED,
}
export interface ILocalOrigin extends IOrigin {
  type: Type.Local,
  source: string,
}

class CanFullyReadLoader extends EventEmitter {
  public readonly canPreload = true;

  protected _loadingStatus = Status.NOT_STARTED;

  public get fullyRead() { return this._loadingStatus === Status.FINISHED; }

  public get canUpload() { return this._loadingStatus === Status.FINISHED; }

  protected _cacheStatus = Status.NOT_STARTED;

  public get canCache() {
    return this._loadingStatus === Status.FINISHED
      && (this._cacheStatus === Status.NOT_STARTED || this._cacheStatus === Status.FINISHED);
  }
}

export class LocalTextLoader extends CanFullyReadLoader implements ILoader {
  public readonly source: ILocalOrigin;

  public constructor(path: string) {
    super();
    this.source = { type: Type.Local, source: path };
    if (dirname(path) === SUBTITLE_FULL_DIRNAME) this._cacheStatus = Status.FINISHED;
  }

  public async getMetadata() { return ''; }

  private _payloadString: string = '';

  public async getPayload(): Promise<string> {
    if (this._loadingStatus === Status.NOT_STARTED) {
      this._loadingStatus = Status.WORKING;
      this._payloadString = await loadLocalFile(this.source.source);
      this._loadingStatus = Status.FINISHED;
      this.emit('cache', this.canCache);
      this.emit('upload', this.canUpload);
      this.emit('read', this.fullyRead);
    }
    return this._payloadString;
  }

  public pause() {}

  public async cache() {
    if (this.canCache) {
      const { source } = this.source;
      const hash = await mediaQuickHash.try(source);
      if (hash) {
        this._cacheStatus = Status.WORKING;
        const storedPath = join(SUBTITLE_FULL_DIRNAME, `${hash}${extname(source)}`);
        ensureDirSync(SUBTITLE_FULL_DIRNAME);
        if (!existsSync(storedPath)) await copyFile(source, storedPath);
        this._cacheStatus = Status.FINISHED;
        return {
          type: Type.Local,
          source: storedPath,
        };
      }
      throw new Error('Invalid hash.');
    }
    throw new Error('Cannot cache now.');
  }

  public async destroy() { this._payloadString = ''; }
}

export class LocalBinaryLoader extends CanFullyReadLoader {
  public readonly source: ILocalOrigin;

  public constructor(path: string) {
    super();
    this.source = { type: Type.Local, source: path };
    if (dirname(path) === SUBTITLE_FULL_DIRNAME) this._cacheStatus = Status.FINISHED;
  }

  public async getMetadata() { return ''; }

  private _payloadBuffer: Buffer;

  public async getPayload(): Promise<Buffer> {
    if (this._loadingStatus === Status.NOT_STARTED) {
      this._loadingStatus = Status.WORKING;
      this._payloadBuffer = await readFile(this.source.source);
      this._loadingStatus = Status.FINISHED;
      this.emit('cache', this.canCache);
      this.emit('upload', this.canUpload);
      this.emit('read', this.fullyRead);
    }
    return this._payloadBuffer;
  }

  public pause() {}

  public async cache() {
    if (this.canCache) {
      const { source } = this.source;
      if (dirname(source) === SUBTITLE_FULL_DIRNAME) {
        return {
          type: Type.Local,
          source,
        };
      }
      const hash = await mediaQuickHash.try(source);
      if (hash) {
        this._cacheStatus = Status.WORKING;
        const storedPath = join(SUBTITLE_FULL_DIRNAME, `${hash}${extname(source)}`);
        ensureDirSync(SUBTITLE_FULL_DIRNAME);
        if (!existsSync(storedPath)) await copyFile(source, storedPath);
        this._cacheStatus = Status.FINISHED;
        return {
          type: Type.Local,
          source: storedPath,
        };
      }
      throw new Error('Invalid hash.');
    }
    throw new Error('Cannot cache now.');
  }

  public async destroy() { this._payloadBuffer = Buffer.alloc(0); }
}
export interface IEmbeddedOrigin extends IOrigin {
  type: Type.Embedded,
  source: {
    videoPath: string,
    streamIndex: number,
    isImage?: boolean,
  },
}
export class EmbeddedStreamLoader extends EventEmitter implements ILoader {
  public readonly canPreload = false;

  private _loadingStatus = Status.NOT_STARTED;

  public get fullyRead() { return this._loadingStatus === Status.FINISHED; }

  public get canUpload() { return this._loadingStatus === Status.FINISHED; }

  private _cacheStatus = Status.NOT_STARTED;

  public get canCache() {
    return this._loadingStatus === Status.FINISHED
      && (this._cacheStatus === Status.NOT_STARTED || this._cacheStatus === Status.FINISHED);
  }

  public readonly source: IEmbeddedOrigin;

  private readonly format: Format;

  public constructor(videoPath: string, streamIndex: number, format: Format) {
    super();
    this.source = { type: Type.Embedded, source: { videoPath, streamIndex } };
    this.format = format;
  }

  private _cachedPayload: Buffer = Buffer.alloc(0);

  /**
   * @description 如果已经缓存过了 就返回缓存的payload
   * 没有缓存过的，就先开始流式提取，加入extraction-finished事件，extraction-finished发生就缓存提取(有序)
   * @param {number} [time]
   * @returns {(Promise<Buffer | undefined>)}
   */
  public async getPayload(time?: number): Promise<Buffer | undefined> {
    if ((typeof time === 'undefined')
      || (this.fullyRead && this._cacheStatus === Status.FINISHED)) {
      return this._cachedPayload;
    }
    this._paused = false;
    if (!this.listenerCount('extraction-finished')) {
      this.on('extraction-finished', () => {
        if (!this._paused && this._currentTime === -1) this.extractSequentially();
      });
      this.once('all-finished', () => {
        this._loadingStatus = Status.FINISHED;
        this.emit('cache', this.canCache);
        this.emit('upload', this.canUpload);
        this.emit('read', this.fullyRead);
        this.removeAllListeners();
      });
    }
    this._currentTime = time;
    return this.extractRandomly();
  }

  public async cache() {
    if (this.canCache && existsSync(this._cachedPath)) {
      return {
        type: Type.Local,
        source: this._cachedPath,
      };
    }
    throw new Error('Cannot cache now.');
  }

  private _metadataString: string = '';

  public async getMetadata() {
    if (!this._metadataString) {
      this._loadingStatus = Status.WORKING;
      const { videoPath, streamIndex } = this.source.source;
      const result = await getSubtitleMetadata(videoPath, streamIndex, this.format);
      if (result) this._metadataString = result;
    }
    return this._metadataString;
  }

  private _cacheCounter = 0;

  private _cachedPath: string = '';

  /**
   * @description 缓存提取
   * @private
   */
  private async extractSequentially() {
    if (!this._metadataString) await this.getMetadata();
    const { videoPath, streamIndex } = this.source.source;
    if (!this._cacheCounter) console.time(`${this.source.source.streamIndex}-cache-took: `);
    this._cacheCounter += 1;
    console.time(`${this.source.source.streamIndex}-cache-${this._cacheCounter}`);
    const result = await cacheSubtitle(videoPath, streamIndex);
    if (result) {
      this._cacheStatus = Status.FINISHED;
      this._cachedPath = result;
      console.warn(result);
      this._cachedPayload = await readFile(result);
      this.emit('all-finished');
      console.timeEnd(`${this.source.source.streamIndex}-cache-took: `);
    } else this.emit('extraction-finished');
    console.timeEnd(`${this.source.source.streamIndex}-cache-${this._cacheCounter}`);
  }

  private _currentTime: number = -1;

  private _streamCounter = 0;

  /**
   * @description 流式提取
   * @returns {(Promise<Buffer | undefined>)}
   */
  private async extractRandomly(): Promise<Buffer | undefined> {
    if (!this._metadataString) await this.getMetadata();
    if (this._currentTime !== -1) {
      this._streamCounter += 1;
      console.time(`${this.source.source.streamIndex}-stream-${this._streamCounter}`);
      const { videoPath, streamIndex } = this.source.source;
      const result = await getSubtitleFragment(videoPath, streamIndex, this._currentTime);
      console.timeEnd(`${this.source.source.streamIndex}-stream-${this._streamCounter}`);
      this._currentTime = -1;
      this.emit('extraction-finished');
      if (result) return result;
    }
    this.emit('extraction-finished');
    return undefined;
  }

  private _paused = false;

  public pause() { this._paused = true; }

  public async destroy() {
    this.removeAllListeners();
    await finishSubtitleExtraction(
      this.source.source.videoPath,
      this.source.source.streamIndex,
    );
  }
}
export interface ISagiOrigin extends IOrigin {
  type: Type.Online,
  source: string,
}
export class SagiLoader extends EventEmitter implements ILoader {
  public readonly canPreload = true;

  private _loadingStatus = Status.NOT_STARTED;

  public get fullyRead() { return this._loadingStatus === Status.FINISHED; }

  public get canUpload() { return this._loadingStatus === Status.FINISHED; }

  private _cacheStatus = Status.NOT_STARTED;

  public get canCache() {
    return this._loadingStatus === Status.FINISHED && this._cacheStatus === Status.NOT_STARTED;
  }

  public readonly source: ISagiOrigin;

  public constructor(hash: string) {
    super();
    this.source = { type: Type.Online, source: hash };
  }

  private _payloads: SagiTextSubtitlePayload = [];

  public async getMetadata() { return ''; }

  public async getPayload(): Promise<SagiTextSubtitlePayload> {
    if (this._loadingStatus === Status.NOT_STARTED) {
      this._loadingStatus = Status.WORKING;
      this._payloads = await Sagi.getTranscript({
        transcriptIdentity: this.source.source,
        startTime: 0,
      });
      this._loadingStatus = Status.FINISHED;
      this.emit('cache', this.canCache);
      this.emit('upload', this.canUpload);
      this.emit('read', this.fullyRead);
    }
    return this._payloads;
  }

  public pause() {}

  public async cache() {
    if (this.canCache) {
      const { source } = this.source;
      this._cacheStatus = Status.NOT_STARTED;
      const storedPath = join(SUBTITLE_FULL_DIRNAME, `${source}.${formatToExtension(Format.WebVTT)}`);
      if (!existsSync(storedPath)) {
        await outputFile(storedPath, sagiSubtitleToWebVTT(this._payloads));
      }
      this._cacheStatus = Status.FINISHED;
      return {
        type: Type.Local,
        source: storedPath,
      };
    }
    throw new Error('Cannot cache now.');
  }

  public async destroy() { this._payloads = []; }
}

export interface IModifiedOrigin extends IOrigin {
  type: Type.Modified,
  source: string,
}

export class ModifiedLoader extends EventEmitter implements ILoader {
  public readonly canPreload = true;

  private _loadingStatus = Status.NOT_STARTED;

  public get fullyRead() { return this._loadingStatus === Status.FINISHED; }

  public get canUpload() { return this._loadingStatus === Status.FINISHED; }

  private _cacheStatus = Status.FINISHED;

  public get canCache() {
    return this._loadingStatus === Status.FINISHED && this._cacheStatus === Status.NOT_STARTED;
  }

  public readonly source: IModifiedOrigin;

  public constructor(hash: string) {
    super();
    this.source = { type: Type.Modified, source: hash };
  }

  private _payloadString: string = '';

  public async getPayload(): Promise<string> {
    if (this._loadingStatus === Status.NOT_STARTED) {
      this._loadingStatus = Status.WORKING;
      const path = join(SUBTITLE_FULL_DIRNAME, `${this.source.source}.modifed`);
      this._payloadString = await loadLocalFile(path);
      this._loadingStatus = Status.FINISHED;
      this.emit('cache', this.canCache);
      this.emit('upload', this.canUpload);
      this.emit('read', this.fullyRead);
    }
    return this._payloadString;
  }

  public pause() { }

  public async cache() {
    return this.source;
  }

  public async getMetadata() { return ''; }

  public async destroy() { this._payloadString = ''; }

  public async save(payload: string) {
    const storedPath = join(SUBTITLE_FULL_DIRNAME, `${this.source.source}.modifed`);
    try {
      const bin = Buffer.from(`\ufeff${payload}`, 'utf8');
      await outputFile(storedPath, bin);
    } catch (error) {
      // empty
    }
  }
}
