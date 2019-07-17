import { ipcRenderer } from 'electron';
import { camelCase } from 'lodash';
import { MediaTask, BaseMediaTaskQueue } from './mediaTaskQueue';
import { LanguageCode, normalizeCode } from '@/libs/language';
import { mediaQuickHash } from '@/libs/utils';

/* eslint-disable camelcase */
enum CodecType {
  Video = 'video',
  Audio = 'audio',
  Subtitle = 'subtitle',
  Attachment = 'attachment',
}
// taken from https://github.com/FFmpeg/FFmpeg/blob/master/doc/ffprobe.xsd
interface RawStreamDisposition {
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
interface RawTag {
  language?: string;
  filename?: string;
  mimetype?: string;
}
interface RawBaseStream {
  disposition?: RawStreamDisposition;
  tag?: RawTag;
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
interface RawVideoStream extends RawBaseStream {
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
interface RawAudioStream extends RawBaseStream {
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
interface RawSubtitleStream extends RawBaseStream {
  codec_type: CodecType.Subtitle;
}
interface RawAttachmentStream extends RawBaseStream {
  codec_type: CodecType.Attachment;
}
type RawStream = RawVideoStream | RawAudioStream | RawSubtitleStream | RawAttachmentStream;
interface RawFormat {
  tag?: RawTag;
  filename: string;
  nb_streams: number;
  nb_programs: number;
  format_name: string;
  format_long_name?: string;
  start_time?: number;
  duration?: number;
  size?: number;
  bit_rate?: number;
  probe_score?: number;
}
interface RawMediaInfo {
  streams?: RawStream[];
  format?: RawFormat;
}

interface StreamDisposition {
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
interface Tag {
  language?: LanguageCode;
  filename?: string;
  mimetype?: string;
}
interface BaseStream {
  disposition?: RawStreamDisposition;
  tag?: Tag;
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
interface VideoStream extends BaseStream {
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
interface AudioStream extends BaseStream {
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
interface SubtitleStream extends BaseStream {
  codecType: CodecType.Subtitle;
}
interface AttachmentStream extends BaseStream {
  codecType: CodecType.Attachment;
}
interface Format {
  tag?: Tag;
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
type Stream = VideoStream | AudioStream | SubtitleStream | AttachmentStream;
interface MediaInfo {
  streams?: Stream[];
  format?: Format;
}

class MediaInfoTask implements MediaTask<MediaInfo> {
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

  private static streamDispositionMapper(raw: RawStreamDisposition): StreamDisposition {
    return Object.entries(raw)
      .reduce((result, entry: [string, number]) => {
        result[camelCase(entry[0])] = !!entry[1];
        return result;
      }, {}) as StreamDisposition;
  }

  private static tagMapper(raw: RawTag): Tag {
    return Object.entries(raw)
      .reduce((result, entry: [string, unknown]) => {
        if (entry[0] === 'language') result[entry[0]] = normalizeCode(entry[1] as string);
        else result[camelCase(entry[0])] = entry[1];
        return result;
      }, {}) as Tag;
  }

  private static videoStreamMapper(raw: RawVideoStream): VideoStream {
    return Object.entries(raw)
      .reduce((result, entry: [string, unknown]) => {
        if (entry[0] === 'disposition') result[entry[0]] = MediaInfoTask.streamDispositionMapper(entry[1] as RawStreamDisposition);
        else if (entry[0] === 'tags') result[entry[0]] = MediaInfoTask.tagMapper(entry[1] as RawTag);
        else if (entry[0] === 'has_b_frames') result[camelCase(entry[0])] = !!entry[1];
        else result[camelCase(entry[0])] = entry[1];
        return result;
      }, {}) as VideoStream;
  }

  private static audioStreamMapper(raw: RawAudioStream): AudioStream {
    return Object.entries(raw)
      .reduce((result, entry: [string, unknown]) => {
        if (entry[0] === 'disposition') result[entry[0]] = MediaInfoTask.streamDispositionMapper(entry[1] as RawStreamDisposition);
        else if (entry[0] === 'tags') result[entry[0]] = MediaInfoTask.tagMapper(entry[1] as RawTag);
        else result[camelCase(entry[0])] = entry[1];
        return result;
      }, {}) as AudioStream;
  }

  private static subtitleStreamMapper(raw: RawSubtitleStream): SubtitleStream {
    return Object.entries(raw)
      .reduce((result, entry: [string, unknown]) => {
        if (entry[0] === 'disposition') result[entry[0]] = MediaInfoTask.streamDispositionMapper(entry[1] as RawStreamDisposition);
        else if (entry[0] === 'tags') result[entry[0]] = MediaInfoTask.tagMapper(entry[1] as RawTag);
        else result[camelCase(entry[0])] = entry[1];
        return result;
      }, {}) as SubtitleStream;
  }

  private static attachmentStreamMapper(raw: RawAttachmentStream): AttachmentStream {
    return Object.entries(raw)
      .reduce((result, entry: [string, unknown]) => {
        if (entry[0] === 'disposition') result[entry[0]] = MediaInfoTask.streamDispositionMapper(entry[1] as RawStreamDisposition);
        else if (entry[0] === 'tags') result[entry[0]] = MediaInfoTask.tagMapper(entry[1] as RawTag);
        else result[camelCase(entry[0])] = entry[1];
        return result;
      }, {}) as AttachmentStream;
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

  private static formatMapper(raw: RawFormat): Format {
    return Object.entries(raw)
      .reduce((result, entry: [string, unknown]) => {
        if (entry[0] === 'tags') result[entry[0]] = MediaInfoTask.tagMapper(entry[1] as RawTag);
        else result[camelCase(entry[0])] = entry[1];
        return result;
      }, {}) as Format;
  }

  private static mediaInfoMapper(raw: RawMediaInfo): MediaInfo {
    const result: MediaInfo = {};
    if (raw.streams) result.streams = MediaInfoTask.streamsMapper(raw.streams);
    if (raw.format) result.format = MediaInfoTask.formatMapper(raw.format);
    return result;
  }

  public execute(): Promise<MediaInfo> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('media-info-request', this.path);
      ipcRenderer.once('media-info-reply', (event, error, info) => {
        console.log(JSON.parse(info));
        if (error) reject(error);
        else resolve(MediaInfoTask.mediaInfoMapper(JSON.parse(info) as RawMediaInfo));
      });
    });
  }
}
export class MediaInfoQueue extends BaseMediaTaskQueue {
  public async getMediaInfo(path: string) {
    const result = await super.addTask<MediaInfo>(await MediaInfoTask.from(path));
    if (result instanceof Error) throw result;
    return result;
  }
}
