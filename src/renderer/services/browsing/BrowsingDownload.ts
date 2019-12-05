import electron from 'electron';
// @ts-ignore
import youtubedl from 'youtube-dl';
import fs from 'fs';
import url from 'url';
import Path from 'path';
import http from 'http';
import request from 'request';
// @ts-ignore
import progress from 'request-progress';
// @ts-ignore
import streamify from 'streamify';
import { log } from '@/libs/Log';
import { IBrowsingDownload } from '@/interfaces/IBrowsingDownload';

class BrowsingDownload implements IBrowsingDownload {
  private url: string;

  private id: string;

  private progress: number;

  private initProgress: number;

  private size: number;

  private path: string;

  private name: string;

  private req: request.Request | null;

  private paused: boolean;

  private lastProgress: number;

  public constructor(url: string) {
    this.url = url;
    this.id = '';
    this.paused = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async getDownloadVideo(): Promise<any> {
    return new Promise(((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      youtubedl.getInfo(this.url, (err: any, info: any) => {
        if (err) reject(err);
        resolve({ info, url: this.url });
      });
    }));
  }

  public startDownload(id: string, name: string, path: string): void {
    this.progress = 0;
    this.initProgress = 0;
    this.lastProgress = 0;
    const stream = streamify({
      superCtor: http.ServerResponse,
      readable: true,
      writable: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    youtubedl.getInfo(this.url, ['-f', id], (err: any, data: any) => (err ? stream.emit('error', err) : this.processData(data, stream)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream.on('info', (info: any) => {
      this.size = info.size + this.initProgress;
      this.id = this.url + id;
      electron.ipcRenderer.send('transfer-download-info', {
        id: this.id, url: this.url, name, path, size: this.size,
      });
      this.path = path;
      this.name = name;
      stream.pipe(fs.createWriteStream(Path.join(path, name)));
    });
    stream.on('data', (chunk: Buffer) => {
      this.progress += chunk.length;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream.on('error', (e: any) => {
      electron.ipcRenderer.send('start-download-error');
      log.error('download video error', e.stderr);
      this.req = null;
    });
    stream.on('end', () => {
      this.req = null;
    });
    stream.on('complete', () => {
      electron.ipcRenderer.send('transfer-progress', { id: this.id, pos: this.size, speed: 0 });
      electron.ipcRenderer.send('show-notification', { name: this.name, path: this.path });
      log.info('download complete', path);
      this.req = null;
    });
  }

  public pause() {
    if (this.req) {
      this.req.pause();
      this.paused = true;
    }
  }

  public resume() {
    if (this.req) {
      this.req.resume();
      this.paused = false;
    }
  }

  public abort() {
    if (this.req) {
      this.req.abort();
    }
  }

  public getId() {
    return this.id;
  }

  public getProgress(): number {
    return this.progress;
  }

  public getSize(): number {
    return this.size;
  }

  public getUrl(): string {
    return this.url;
  }

  public getName(): string {
    return this.name;
  }

  public getPath(): string {
    return this.path;
  }

  public continueDownload(id: string, name: string, path: string, lastIndex: number): void {
    this.initProgress = lastIndex;
    this.progress = lastIndex;
    this.lastProgress = lastIndex;
    const stream = streamify({
      superCtor: http.ServerResponse,
      readable: true,
      writable: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    youtubedl.getInfo(this.url, ['-f', id], (err: any, data: any) => (err ? stream.emit('error', err) : this.processData(data, stream, { start: lastIndex })));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream.on('info', (info: any) => {
      this.size = info.size + this.initProgress;
      this.id = this.url + id;
      this.path = path;
      this.name = name;
      stream.pipe(fs.createWriteStream(Path.join(path, name), { flags: 'a' }));
    });
    stream.on('data', (chunk: Buffer) => {
      this.progress += chunk.length;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream.on('error', (e: any) => {
      log.error('download video error 2222', e.stderr);
      this.req = null;
    });
    stream.on('end', () => {
      this.req = null;
    });
    stream.on('complete', () => {
      electron.ipcRenderer.send('transfer-progress', { id: this.id, pos: this.size, speed: 0 });
      log.info('download complete', path);
      this.req = null;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processData(data: any, stream: any, options?: { start: number }) {
    const item = !data.length ? data : data.shift();
    // fix for pause/resume downloads
    const headers = Object.assign(
      { Host: url.parse(item.url).hostname },
      data.http_headers,
    );

    if (options && options.start > 0) {
      headers.Range = `bytes=${options.start}-`;
    }
    this.req = progress(request({
      url: item.url,
      headers,
    }));
    (this.req as request.Request).on('progress', () => {
      if (!this.paused) {
        const speed = this.progress - this.lastProgress;
        this.lastProgress = this.progress;
        electron.ipcRenderer.send('transfer-progress', { id: this.id, pos: this.progress, speed });
      }
    });
    // eslint-disable-next-line consistent-return
    (this.req as request.Request).on('response', (res: http.IncomingMessage) => {
      const size = parseInt((res.headers['content-length'] as string), 10);
      if (size) item.size = size;

      if (options && options.start > 0 && res.statusCode === 416) {
        // the file that is being resumed is complete.
        return stream.emit('complete', item);
      }

      if (res.statusCode !== 200 && res.statusCode !== 206) {
        return stream.emit('error', new Error(`status code ${res.statusCode}`));
      }

      stream.emit('info', item);

      stream.on('end', () => {
        if (data.length) stream.emit('next', data);
      });
    });
    (this.req as request.Request).on('error', (err) => {
      electron.ipcRenderer.send('downloading-network-error', this.id);
      stream.emit('error', err);
    });
    return stream.resolve(this.req);
  }
}

export default BrowsingDownload;
