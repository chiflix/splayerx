import { LanguageCode } from '@/libs/language';

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
  codecName?: string;
  codecLongName?: string;
  profile?: string;
  codecType?: CodecType;
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
export interface ISubtitleStream extends IBaseStream {
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
