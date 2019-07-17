/* eslint-disable camelcase */
enum CodecType {
  Video = 'video',
  Audio = 'audio',
  Subtitle = 'subtitle',
  Attachment = 'attachment',
}
// taken from https://github.com/FFmpeg/FFmpeg/blob/master/doc/ffprobe.xsd
type RawStreamDisposition = {
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
};
type RawTag = {
  language?: string;
  filename?: string;
  mimetype?: string;
};
type RawPacketSideDataList = {
  side_data: {
    side_data_type: string;
    side_data_size: number;
  };
};
interface RawBaseStream {
  disposition?: RawStreamDisposition;
  tag?: RawTag;
  side_data_list?: RawPacketSideDataList;
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
  codec_type: CodecType.Subtitle;
}
type RawStreams = (RawVideoStream | RawAudioStream | RawSubtitleStream | RawAttachmentStream)[];
type RawFormat = {
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
};
type RawMediaInfo = {
  streams?: RawStreams;
  format?: RawFormat;
};

type StreamDisposition = {
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
};
type Tag = {
  language?: string;
  filename?: string;
  mimetype?: string;
};
type PacketSideDataList = {
  sideData: {
    sideDataType: string;
    sideDataSize: number;
  };
};
interface BaseStream {
  disposition?: RawStreamDisposition;
  tag?: Tag;
  sideDataList?: RawPacketSideDataList;
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
type Format = {
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
};
type Streams = (VideoStream | AudioStream | SubtitleStream | AttachmentStream)[];
type MediaInfo = {
  streams?: Streams[];
  format?: Format;
};
