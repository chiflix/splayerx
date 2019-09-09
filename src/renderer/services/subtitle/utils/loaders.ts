import { dirname, join, extname } from 'path';
import {
  ensureDirSync, existsSync, copyFile, outputFile, writeFile,
} from 'fs-extra';
import { EventEmitter } from 'events';
import {
  ILoader, IOrigin, Type, Format,
} from '@/interfaces/ISubtitle';
import { loadLocalFile, formatToExtension } from '.';
import { SUBTITLE_FULL_DIRNAME } from '@/constants';
import { mediaQuickHash, getSubtitleDir } from '@/libs/utils';
import Sagi from '@/libs/sagi';
import { SagiSubtitlePayload } from '../parsers';
import { sagiSubtitleToWebVTT } from './transcoders';
import {
  getSubtitleMetadata, cacheSubtitle, getSubtitleFragment, finishSubtitleExtraction,
} from '@/plugins/mediaTasks';

enum Status {
  NOT_STARTED,
  WORKING,
  FINISHED,
}
export interface ILocalTextOrigin extends IOrigin {
  type: Type.Local;
  source: string;
}
export class LocalTextLoader extends EventEmitter implements ILoader {
  public readonly canPreload = true;

  private _loadingStatus = Status.NOT_STARTED;

  public get fullyRead() { return this._loadingStatus === Status.FINISHED; }

  public get canUpload() { return this._loadingStatus === Status.FINISHED; }

  private _cacheStatus = Status.NOT_STARTED;

  public get canCache() {
    return this._loadingStatus === Status.FINISHED && this._cacheStatus === Status.NOT_STARTED;
  }

  public readonly source: ILocalTextOrigin;

  public constructor(path: string) {
    super();
    this.source = { type: Type.Local, source: path };
    if (dirname(path) === SUBTITLE_FULL_DIRNAME) this._cacheStatus = Status.FINISHED;
  }

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
export interface IEmbeddedOrigin extends IOrigin {
  type: Type.Embedded;
  source: {
    videoPath: string;
    streamIndex: number;
  };
}
export class EmbeddedTextStreamLoader extends EventEmitter implements ILoader {
  public readonly canPreload = false;

  private _loadingStatus = Status.NOT_STARTED;

  public get fullyRead() { return this._loadingStatus === Status.FINISHED; }

  public get canUpload() { return this._loadingStatus === Status.FINISHED; }

  private _cacheStatus = Status.NOT_STARTED;

  public get canCache() {
    return this._loadingStatus === Status.FINISHED && this._cacheStatus === Status.NOT_STARTED;
  }

  public readonly source: IEmbeddedOrigin;

  public constructor(videoPath: string, streamIndex: number) {
    super();
    this.source = { type: Type.Embedded, source: { videoPath, streamIndex } };
  }

  public async getPayload(time?: number): Promise<string> {
    if (this.fullyRead) return this._payloadString;
    this.paused = false;
    if (!this.listenerCount('extraction-finished')) {
      this.on('extraction-finished', () => {
        if (!this.paused && this.currentTime === -1) this.extractSequentially();
      });
      this.once('all-finished', () => {
        this._loadingStatus = Status.FINISHED;
        this.emit('cache', this.canCache);
        this.emit('upload', this.canUpload);
        this.emit('read', this.fullyRead);
        this.removeAllListeners();
      });
    }
    let result = '';
    if (time) {
      this.currentTime = time;
      await this.extractRandomly();
      result = this._payloadString;
      this._payloadString = '';
    } else this.extractSequentially();
    return result;
  }

  public async cache() {
    if (this.canCache) {
      this._cacheStatus = Status.WORKING;
      const { videoPath, streamIndex } = this.source.source;
      const hash = await mediaQuickHash(videoPath);
      const subtitlePath = join(await getSubtitleDir(), `${hash}-${streamIndex}.${Format.AdvancedSubStationAplha}`);
      await writeFile(subtitlePath, this._payloadString);
      this._cacheStatus = Status.FINISHED;
      return {
        type: Type.Local,
        source: subtitlePath,
      };
    }
    throw new Error('Cannot cache now.');
  }

  private _payloadString: string = '';

  private _metadataString: string = '';

  private async getMetadata() {
    if (!this._metadataString) {
      this._loadingStatus = Status.WORKING;
      const { videoPath, streamIndex } = this.source.source;
      const result = await getSubtitleMetadata(videoPath, streamIndex);
      if (result) this._metadataString = result;
    }
  }

  private cacheCount = 0;

  private async extractSequentially() {
    if (!this._metadataString) await this.getMetadata();
    const { videoPath, streamIndex } = this.source.source;
    if (!this.cacheCount) console.time(`${this.source.source.streamIndex}-cache-took: `);
    this.cacheCount += 1;
    console.time(`${this.source.source.streamIndex}-cache-${this.cacheCount}`);
    const result = await cacheSubtitle(videoPath, streamIndex);
    if (result) {
      this._payloadString = result;
      this.emit('all-finished');
      console.timeEnd(`${this.source.source.streamIndex}-cache-took: `);
    } else this.emit('extraction-finished');
    console.timeEnd(`${this.source.source.streamIndex}-cache-${this.cacheCount}`);
  }

  private currentTime: number = -1;

  private initialRandom: boolean = true;

  private streamCount = 0;

  private async extractRandomly() {
    if (!this._metadataString) await this.getMetadata();
    if (this.currentTime !== -1) {
      this.streamCount += 1;
      console.time(`${this.source.source.streamIndex}-stream-${this.streamCount}`);
      const { videoPath, streamIndex } = this.source.source;
      const result = await getSubtitleFragment(videoPath, streamIndex, this.currentTime);
      console.timeEnd(`${this.source.source.streamIndex}-stream-${this.streamCount}`);
      this.currentTime = -1;
      if (result) {
        if (this.initialRandom) {
          this.initialRandom = false;
          this._payloadString += `${this._metadataString}\n${result}`;
        } else this._payloadString = result;
      }
    }
    this.emit('extraction-finished');
  }

  private paused = false;

  public pause() { this.paused = true; }

  public async destroy() {
    this.removeAllListeners();
    this._payloadString = '';
    await finishSubtitleExtraction(this.source.source.videoPath, this.source.source.streamIndex);
  }
}
export interface ISagiOrigin extends IOrigin {
  type: Type.Online;
  source: string;
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

  private _payloads: SagiSubtitlePayload = [];

  public async getPayload(): Promise<SagiSubtitlePayload> {
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
