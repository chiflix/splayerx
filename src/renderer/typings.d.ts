import Vue from 'vue';
import { AxiosInstance } from 'axios';
import { Event } from 'electron';

declare module '*.vue' {
  export default Vue;
}

declare module 'vue/types/vue' {
  interface Vue {
    $store: any;
    $bus: Vue;
    $ga: any;
    $electron: Electron.RendererInterface;
    axios: AxiosInstance;
    $http: AxiosInstance;
  }

  namespace Vue {
    const axios: AxiosInstance;
  }
}

declare global {
  declare const __static: string;
  interface Screen {
    availLeft: number;
    availTop: number;
  }
  namespace JSX {
    // tslint:disable no-empty-interface
    interface Element extends VNode {}
    // tslint:disable no-empty-interface
    interface ElementClass extends Vue {}
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}

declare module 'electron' {
  enum AVSampleFormat {
    AV_SAMPLE_FMT_NONE = -1,
    /** unsigned 8bits */
    AV_SAMPLE_FMT_U8,
    /** signed 16 bits */
    AV_SAMPLE_FMT_S16,
    /** signed 32 bits */
    AV_SAMPLE_FMT_S32,
    /** float */
    AV_SAMPLE_FMT_FLT,
    /** double */
    AV_SAMPLE_FMT_DBL,
    /** unsigned 8 bits, planar */
    AV_SAMPLE_FMT_U8P,
    /** signed 16 bits, planar */
    AV_SAMPLE_FMT_S16P,
    /** signed 32 bits, planar */
    AV_SAMPLE_FMT_S32P,
    /** float, planar */
    AV_SAMPLE_FMT_FLTP,
    /** double, planar */
    AV_SAMPLE_FMT_DBLP,
    /** Number of sample formats. DO NOT USE if linking dynamically */
    AV_SAMPLE_FMT_NB,
  }
  interface SPlayerAPI {
    getMediaInfo(
      /** media file path */
      path: string,
      callback: (
        /** media info json string */
        info: string,
      ) => void,
    ): void;
    snapshotVideo(
      /** source video path to snapshot from */
      srcVideoPath: string,
      /** image path to save */
      imagePath: string,
      /** time string in format of hh:mm:ss */
      time: string,
      /** width number in string */
      width: string,
      /** height number in string */
      height: string,
      callback: (
        /** if not '0', an error occurred */
        error: string,
      ) => void,
    ): void;
    extractSubtitles(
      /** source video path to extract subtitle from */
      srcVideoPath: string,
      /** subtitle path to save */
      subtitlePath: string,
      /** stream index string in the form of 0:s:0 */
      streamIndex?: string,
      callback: (
        /** if not '0', an error occurred */
        error: string,
      ) => void,
    ): void;
    generateThumbnails(
      /** source video path to extract thumbnails from */
      srcVideoPath: string,
      /** image path to save */
      imagePath: string,
      thumbnailWidth: string,
      rowThumbnailCount: string,
      columnThumbnailCount: string,
      callback: (
        /** if not '0', an error occurred */
        error: string,
      ) => void,
    ): void;
    grabAudioFrame(
      /** source video path to grab audio frames from */
      srcVideoPath: string,
      /** only available when first sample a video */
      seekPosition: string,
      /** stream index string in the form of 0:s:0 */
      streamIndex: string,
      /** integer, usually in [1, 8], 0 for all tracks */
      trackIndex: number,
      /** integer, usually in [1, 8] */
      resampleTracksCount: number,
      /** usually in [11000, 48000] */
      resampleFrequency: number,
      resampleFormat: AVSampleFormat,
      /** usually in [1, 200] */
      frameCount: number,
      callback: (
        /** if not '0', an error occurred */
        error: string,
        frameBuffer?: Buffer,
        frameData: string,
      ) => void,
    ): void;
    stopGrabAudioFrame(): void;
  }
  const splayerx: SPlayerAPI;
  interface IpcMain {
    on(channel: 'media-info-request', listener: (event: Event, path: string) => void): this;
    on(channel: 'thumbnail-request', listener: (event: Event,
      videoPath: string, imagePath: string,
      thumbnailWidth: number,
      rowThumbnailCount: number, columnThumbnailCount: number,
    ) => void): this;
    on(channel: 'snapshot-request', listener: (event: Event,
      videoPath: string, imagePath: string,
      timeString: string,
      width: number, height: number,
    ) => void): this;
    on(channel: 'subtitle-request', listener: (event: Event,
      videoPath: string, subtitlePath: string,
      streamIndex: string,
    ) => void): this;
  }
  interface IpcRenderer {
    send(channel: 'media-info-request', path: string): void;
    send(channel: 'thumbnail-request',
      videoPath: string, imagePath: string,
      thumbnailWidth: number,
      rowThumbnailCount: number, columnThumbnailCount: number,
    ): void;
    send(channel: 'snapshot-request',
      videoPath: string, imagePath: string,
      timeString: string,
      width: number, height: number,
    ): void;
    send(channel: 'subtitle-request',
      videoPath: string, subtitlePath: string,
      streamIndex: string,
    ): void;

    on(channel: 'media-info-reply', listener: (event: Event, error: Error | undefined, info: string) => void): this;
    on(channel: 'generate-thumbnail-reply', listener: (event: Event, error: Error | undefined, path: string) => void): this;
    on(channel: 'snapshot-reply', listener: (event: Event, error: Error | undefined, path: string) => void): this;
    on(channel: 'subtitle-reply', listener: (event: Event, error: Error | undefined, path: string) => void): this;

    once(channel: 'media-info-reply', listener: (event: Event, error: Error | undefined, info: string) => void): this;
    once(channel: 'generate-thumbnail-reply', listener: (event: Event, error: Error | undefined, path: string) => void): this;
    once(channel: 'snapshot-reply', listener: (event: Event, error: Error | undefined, path: string) => void): this;
    once(channel: 'subtitle-reply', listener: (event: Event, error: Error | undefined, path: string) => void): this;
  }
  interface Event {
    reply(channel: string, ...args: unknown[]): void;
    reply(channel: 'media-info-reply', error: Error | undefined, info: string): void;
    reply(channel: 'generate-thumbnail-reply', error: Error | undefined, path: string): void;
    reply(channel: 'snapshot-reply', error: Error | undefined, path: string): this;
    reply(channel: 'subtitle-reply', error: Error | undefined, path: string): this;
  }
}
