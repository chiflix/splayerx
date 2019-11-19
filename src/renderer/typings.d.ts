// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import Vue, { VNode } from 'vue';

declare global {
  // eslint-disable-next-line no-underscore-dangle
  declare const __static: string;
  interface Screen {
    availLeft: number;
    availTop: number;
  }
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Element extends VNode {}
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ElementClass extends Vue {}
    interface IntrinsicElements {
      [elem: string]: unknown;
    }
  }

  type Optional<T> = { [key in keyof T]?: T[key] };
  interface JsonMap {
    [member: string]: string | number | boolean | null | JsonArray | JsonMap;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface JsonArray extends Array<string | number | boolean | null | JsonArray | JsonMap> {}
  type Json = JsonMap | JsonArray | string | number | boolean | null;

  interface AbortablePromise<T> extends Promise<T> {
    abort();
  }
}

declare module '*.vue' {
  export default Vue;
}

declare module 'vue/types/vue' {
  interface Vue {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $store: any;
    $bus: Vue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $ga: any;
    $electron: Electron.RendererInterface;
  }
}

declare module 'electron' {
  interface IpcMain {
    on(channel: 'media-info-request', listener: (event: IpcMainEvent, path: string) => void): this;
    on(
      channel: 'snapshot-request',
      listener: (
        event: IpcMainEvent,
        videoPath: string,
        imagePath: string,
        timeString: string,
        width: number,
        height: number,
      ) => void,
    ): this;
    on(
      channel: 'subtitle-metadata-request',
      listener: (
        event: IpcMainEvent,
        videoPath: string,
        streamIndex: number,
        subtitlePath: string,
      ) => void,
    ): this;
    on(
      channel: 'subtitle-cache-request',
      listener: (event: IpcMainEvent, videoPath: string, streamIndex: number) => void,
    ): this;
    on(
      channel: 'subtitle-stream-request',
      listener: (event: IpcMainEvent, videoPath: string, streamIndex: number, time: number) => void,
    ): this;
    on(
      channel: 'subtitle-destroy-request',
      listener: (event: IpcMainEvent, videoPath: string, streamIndex: number) => void,
    ): this;
    on(
      channel: 'thumbnail-request',
      listener: (
        event: IpcMainEvent,
        videoPath: string,
        imagePath: string,
        thumbnailWidth: number,
        columnThumbnailCount: number,
        rowThumbnailCount: number,
      ) => void,
    ): this;
  }

  interface IpcRenderer {
    send(channel: 'media-info-request', path: string): void;
    send(
      channel: 'snapshot-request',
      videoPath: string,
      imagePath: string,
      timeString: string,
      width: number,
      height: number,
    ): void;
    send(
      channel: 'subtitle-metadata-request',
      videoPath: string,
      streamIndex: number,
      subtitlePath: string,
    ): this;
    send(channel: 'subtitle-cache-request', videoPath: string, streamIndex: number): this;
    send(
      channel: 'subtitle-stream-request',
      videoPath: string,
      streamIndex: number,
      time: number,
    ): this;
    send(channel: 'subtitle-destroy-request', videoPath: string, streamIndex: number): this;
    send(
      channel: 'thumbnail-request',
      videoPath: string,
      imagePath: string,
      thumbnailWidth: number,
      columnThumbnailCount: number,
      rowThumbnailCount: number,
    ): void;

    on(
      channel: 'media-info-reply',
      listener: (event: IpcRendererEvent, error?: Error, info: string) => void,
    ): this;
    on(
      channel: 'snapshot-reply',
      listener: (event: IpcRendererEvent, error?: Error, path: string) => void,
    ): this;
    on(
      channel: 'subtitle-metadata-reply',
      listener: (
        event: IpcRendererEvent, error?: Error, finished: boolean, matadata?: string,
      ) => void,
    ): this;
    on(
      channel: 'subtitle-cache-reply',
      listener: (event: IpcRendererEvent, error?: Error, path?: string) => void,
    ): this;
    on(
      channel: 'subtitle-stream-reply',
      listener: (event: IpcRendererEvent, error?: Error, data: Buffer) => void,
    ): this;
    on(channel: 'subtitle-destroy-reply', listener: (event: IpcRendererEvent, error?: Error) => void): this;
    on(
      channel: 'thumbnail-reply',
      listener: (event: IpcRendererEvent, error?: Error, path: string) => void,
    ): this;

    once(
      channel: 'media-info-reply',
      listener: (event: IpcRendererEvent, error?: Error, info: string) => void,
    ): this;
    once(
      channel: 'snapshot-reply',
      listener: (event: IpcRendererEvent, error?: Error, path: string) => void,
    ): this;
    once(
      channel: 'subtitle-metadata-reply',
      listener: (
        event: IpcRendererEvent, error?: Error, finished: boolean, matadata?: string,
      ) => void,
    ): this;
    once(
      channel: 'subtitle-cache-reply',
      listener: (event: IpcRendererEvent, error?: Error, path?: string) => void,
    ): this;
    once(
      channel: 'subtitle-stream-reply',
      listener: (event: IpcRendererEvent, error?: Error, data: Buffer) => void,
    ): this;
    once(channel: 'subtitle-destroy-reply', listener: (event: IpcRendererEvent, error?: Error) => void): this;
    once(
      channel: 'thumbnail-reply',
      listener: (event: IpcRendererEvent, error?: Error, path: string) => void,
    ): this;
  }

  interface IpcRendererEvent {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reply(channel: string, ...args: any[]): void;
    reply(channel: 'media-info-reply', error?: Error, info: string): void;
    reply(channel: 'snapshot-reply', error?: Error, path: string): this;
    reply(
      channel: 'subtitle-metadata-reply',
      error?: Error,
      finished: boolean,
      matadata: string,
    ): this;
    reply(channel: 'subtitle-cache-reply', error?: Error, path?: string): this;
    reply(channel: 'subtitle-stream-reply', error?: Error, data: Buffer): this;
    reply(channel: 'subtitle-destroy-reply', error?: Error): this;
    reply(channel: 'thumbnail-reply', error?: Error, path: string): void;
  }
}
