import Vue from 'vue';
import { AxiosInstance } from 'axios';

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
        err: string,
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
        err: string,
      ) => void,
    ): void;
    generateThumbnails(
      /** source video path to extract thumbnails from */
      srcVideoPath: string,
      /** image path to save */
      imagePath: string,
      thumbnailWidth: string,
      thumbnailHeight: string,
      rowThumbnailCount: string,
      columnThumbnailCount: string,
      callback: (
        /** if not '0', an error occurred */
        err: string,
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
        err: string,
        frameBuffer?: Buffer,
        frameData: string,
      ) => void,
    ): void;
    stopGrabAudioFrame(): void;
  }
  const splayerx: SPlayerAPI;
}
