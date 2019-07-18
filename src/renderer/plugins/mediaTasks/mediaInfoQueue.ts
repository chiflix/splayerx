import { ipcRenderer } from 'electron';
import { camelCase } from 'lodash';
import { IMediaTask, BaseMediaTaskQueue } from './mediaTaskQueue';
import { LanguageCode, normalizeCode } from '@/libs/language';
import { mediaQuickHash } from '@/libs/utils';

type EntryOf<T> = [keyof T, T[keyof T]];

/* eslint-disable camelcase */
enum CodecType {
  Video = 'video',
  Audio = 'audio',
  Subtitle = 'subtitle',
  Attachment = 'attachment',
}
// taken from https://github.com/FFmpeg/FFmpeg/blob/master/doc/ffprobe.xsd
interface IRawStreamDisposition {
  default: number;
  dub: number;
  original: number;
  comment: number;
  lyrics: number;
  karaoke: number;
  forced: number;
  hearing_impaired: number;
  visual_impaired: number;
  clean_effects: number;
  attached_pic: number;
  timed_thumbnails: number;
}
interface IRawTag {
  language?: string;
  filename?: string;
  mimetype?: string;
}
interface IRawBaseStream {
  disposition?: IRawStreamDisposition;
  tags?: IRawTag;
  index: number;
  codec_name?: string;
  codec_long_name?: string;
  profile?: string;
  codec_type?: CodecType;
  codec_time_base: string;
  codec_tag: string;
  codec_tag_string: string;
  extradata?: string;
  extradata_hash?: string;
}
interface IRawVideoStream extends IRawBaseStream {
  codec_type: CodecType.Video;
  width?: number;
  height?: number;
  coded_width?: number;
  coded_height?: number;
  has_b_frames?: number;
  sample_aspect_ratio?: string;
  display_aspect_ratio?: string;
  pix_fmt?: string;
  level?: number;
  color_range?: string;
  color_space?: string;
  chroma_location?: string;
  field_order?: string;
  timecode?: string;
  refs?: number;
}
interface IRawAudioStream extends IRawBaseStream {
  codec_type: CodecType.Audio;
  sample_fmt?: string;
  sample_rate?: number;
  channels?: number;
  channel_layout?: string;
  bits_per_sample?: number;
  id?: string;
  r_frame_rate: string;
  avg_frame_rate: string;
  time_base: string;
  start_pts?: number;
  start_time?: number;
  duration_ts?: number;
  duration?: number;
  bit_rate?: number;
  max_bit_rate?: number;
  bits_per_raw_sample?: number;
  nb_frames?: number;
  nb_read_frames?: number;
  nb_read_packets?: number;
}
interface IRawSubtitleStream extends IRawBaseStream {
  codec_type: CodecType.Subtitle;
}
interface IRawAttachmentStream extends IRawBaseStream {
  codec_type: CodecType.Attachment;
}
type RawStream = IRawVideoStream | IRawAudioStream | IRawSubtitleStream | IRawAttachmentStream;
interface IRawFormat {
  tags?: IRawTag;
  filename: string;
  nb_streams: number;
  nb_programs: number;
  format_name: string;
  format_long_name?: string;
  start_time?: string;
  duration?: string;
  size?: string;
  bit_rate?: string;
  probe_score?: number;
}
interface IRawMediaInfo {
  streams?: RawStream[];
  format?: IRawFormat;
}

interface IStreamDisposition {
  default: boolean;
  dub: boolean;
  original: boolean;
  comment: boolean;
  lyrics: boolean;
  karaoke: boolean;
  forced: boolean;
  hearingImpaired: boolean;
  visualImpaired: boolean;
  cleanEffects: boolean;
  attachedPic: boolean;
  timedThumbnails: boolean;
}
interface ITag {
  language?: LanguageCode;
  filename?: string;
  mimetype?: string;
}
interface IBaseStream {
  disposition?: IRawStreamDisposition;
  tags?: ITag;
  index: number;
  codecName?: CodecType;
  codecLongName?: string;
  profile?: string;
  codecType?: string;
  codecTimeBase: string;
  codecTag: string;
  codecTagString: string;
  extradata?: string;
  extradataHash?: string;
}
interface IVideoStream extends IBaseStream {
  codecType: CodecType.Video;
  width?: number;
  height?: number;
  codedWidth?: number;
  codedHeight?: number;
  hasBFrames?: boolean;
  sampleAspectRatio?: string;
  displatAspectRatio?: string;
  pixFmt?: string;
  level?: number;
  colorRange?: string;
  colorSpace?: string;
  chromaLocation?: string;
  fieldOrder?: string;
  timecode?: string;
  refs?: number;
}
interface IAudioStream extends IBaseStream {
  codecType: CodecType.Audio;
  sampleFmt?: string;
  sampleRate?: number;
  channels?: number;
  channelLayout?: string;
  bitsPerSample?: number;
  id?: string;
  rFrameRate: string;
  avgFrameRate: string;
  timeBase: string;
  startPts: number;
  startTime: number;
  durationTs: number;
  duration: number;
  bitRate: number;
  maxBitRate: number;
  bitsPerRawSample: number;
  nbFrames: number;
  nbReadFrames: number;
  nbReadPackets: number;
}
interface ISubtitleStream extends IBaseStream {
  codecType: CodecType.Subtitle;
}
interface IAttachmentStream extends IBaseStream {
  codecType: CodecType.Attachment;
}
interface IFormat {
  tags?: ITag;
  filename: string;
  nbStreams: number;
  nbPrograms: number;
  formatName: string;
  formatLongName?: string;
  startTime?: number;
  duration?: number;
  size?: number;
  bitRate?: number;
  probeScore?: number;
}
type Stream = IVideoStream | IAudioStream | ISubtitleStream | IAttachmentStream;
interface IMediaInfo {
  streams?: Stream[];
  format?: IFormat;
}

class MediaInfoTask implements IMediaTask<IMediaInfo> {
  private path: string = '';

  private hash: string = '';

  private constructor(path: string, hash: string) {
    this.path = path;
    this.hash = hash;
  }

  public static async from(path: string) {
    const hash = await mediaQuickHash(path);
    return new MediaInfoTask(path, hash);
  }

  public getId() { return this.hash; }

  private static streamDispositionMapper(raw: IRawStreamDisposition): IStreamDisposition {
    const entries = (Object.entries(raw) as EntryOf<IRawStreamDisposition>[])
      .map(({ 0: key, 1: value }) => [camelCase(key), !!value]);
    return Object.fromEntries(entries) as IStreamDisposition;
  }

  private static tagMapper(raw: IRawTag): ITag {
    const entries = (Object.entries(raw) as EntryOf<IRawTag>[])
      .map(({ 0: key, 1: value }) => [camelCase(key), key === 'language' ? normalizeCode(value as string) : value]);
    return Object.fromEntries(entries) as ITag;
  }

  private static videoStreamMapper(raw: IRawVideoStream): IVideoStream {
    const entries = (Object.entries(raw) as EntryOf<IRawVideoStream>[])
      .map(({ 0: key, 1: value }) => {
        const newKey = camelCase(key);
        switch (key) {
          default:
            return [newKey, value];
          case 'disposition':
            return [newKey, MediaInfoTask.streamDispositionMapper(value as IRawStreamDisposition)];
          case 'tags':
            return [newKey, MediaInfoTask.tagMapper(value as IRawTag)];
          case 'has_b_frames':
            return [newKey, !!value];
        }
      });
    return Object.fromEntries(entries) as IVideoStream;
  }

  private static audioStreamMapper(raw: IRawAudioStream): IAudioStream {
    const entries = (Object.entries(raw) as EntryOf<IRawAudioStream>[])
      .map(({ 0: key, 1: value }) => {
        const newKey = camelCase(key);
        switch (key) {
          default:
            return [newKey, value];
          case 'disposition':
            return [newKey, MediaInfoTask.streamDispositionMapper(value as IRawStreamDisposition)];
          case 'tags':
            return [newKey, MediaInfoTask.tagMapper(value as IRawTag)];
        }
      });
    return Object.fromEntries(entries) as IAudioStream;
  }

  private static subtitleStreamMapper(raw: IRawSubtitleStream): ISubtitleStream {
    const entries = (Object.entries(raw) as EntryOf<IRawSubtitleStream>[])
      .map(({ 0: key, 1: value }) => {
        const newKey = camelCase(key);
        switch (key) {
          default:
            return [newKey, value];
          case 'disposition':
            return [newKey, MediaInfoTask.streamDispositionMapper(value as IRawStreamDisposition)];
          case 'tags':
            return [newKey, MediaInfoTask.tagMapper(value as IRawTag)];
        }
      });
    return Object.fromEntries(entries) as ISubtitleStream;
  }

  private static attachmentStreamMapper(raw: IRawAttachmentStream): IAttachmentStream {
    const entries = (Object.entries(raw) as EntryOf<IRawAttachmentStream>[])
      .map(({ 0: key, 1: value }) => {
        const newKey = camelCase(key);
        switch (key) {
          default:
            return [newKey, value];
          case 'disposition':
            return [newKey, MediaInfoTask.streamDispositionMapper(value as IRawStreamDisposition)];
          case 'tags':
            return [newKey, MediaInfoTask.tagMapper(value as IRawTag)];
        }
      });
    return Object.fromEntries(entries) as IAttachmentStream;
  }

  private static streamsMapper(raw: RawStream[]): Stream[] {
    return raw.map((stream) => {
      switch (stream.codec_type) {
        default:
          return undefined;
        case CodecType.Video:
          return MediaInfoTask.videoStreamMapper(stream);
        case CodecType.Audio:
          return MediaInfoTask.audioStreamMapper(stream);
        case CodecType.Subtitle:
          return MediaInfoTask.subtitleStreamMapper(stream);
        case CodecType.Attachment:
          return MediaInfoTask.attachmentStreamMapper(stream);
      }
    })
      .filter(stream => !!stream) as Stream[];
  }

  private static formatMapper(raw: IRawFormat): IFormat {
    const entries = (Object.entries(raw) as EntryOf<IRawFormat>[])
      .map(({ 0: key, 1: value }) => {
        const newKey = camelCase(key);
        switch (key) {
          default:
            return [newKey, value];
          case 'bit_rate':
          case 'size':
            return [newKey, parseInt(value as string, 10)];
          case 'duration':
          case 'start_time':
            return [newKey, parseFloat(value as string)];
          case 'tags':
            return [newKey, MediaInfoTask.tagMapper(value as IRawTag)];
        }
      });
    return Object.fromEntries(entries) as unknown as IFormat;
  }

  private static mediaInfoMapper(raw: IRawMediaInfo): IMediaInfo {
    const result: IMediaInfo = {};
    if (raw.streams) result.streams = MediaInfoTask.streamsMapper(raw.streams);
    if (raw.format) result.format = MediaInfoTask.formatMapper(raw.format);
    return result;
  }

  public execute(): Promise<IMediaInfo> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('media-info-request', this.path);
      ipcRenderer.once('media-info-reply', (event, error, info) => {
        if (error) reject(error);
        else resolve(MediaInfoTask.mediaInfoMapper(JSON.parse(info) as IRawMediaInfo));
      });
    });
  }
}
export class MediaInfoQueue extends BaseMediaTaskQueue {
  public async getMediaInfo(path: string) {
    try {
      const result = await super.addTask<IMediaInfo>(await MediaInfoTask.from(path));
      if (result instanceof Error) return undefined;
      return result;
    } catch (err) { return undefined; }
  }

  public async getFormat(path: string): Promise<IFormat | undefined> {
    const result = await this.getMediaInfo(path);
    if (result && result.format) return result.format;
    return undefined;
  }

  public async getStreams(path: string): Promise<Stream[]> {
    const result = await this.getMediaInfo(path);
    if (result && result.streams) return result.streams;
    return [];
  }

  public async getSubtitleStreams(path: string): Promise<ISubtitleStream[]> {
    const streams = await this.getStreams(path);
    return streams.filter(({ codecType }) => codecType === CodecType.Subtitle) as ISubtitleStream[];
  }
}
