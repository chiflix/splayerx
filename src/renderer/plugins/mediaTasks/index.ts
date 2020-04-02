import { log } from '@/libs/Log';
import { Format } from '@/interfaces/ISubtitle';
import MediaInfoQueue, { CodecType, ISubtitleStream, Stream } from './mediaInfoQueue';
import SnapshotQueue from './snapshotSubtitleQueue';
import SubtitleQueue from './subtitleQueue';
import ThumbnailQueue from './thumbnailQueue';

const mediaInfoQueue = new MediaInfoQueue();
const snapshotQueue = new SnapshotQueue();
const subtitleQueue = new SubtitleQueue();
const thumbnailQueue = new ThumbnailQueue();

// 存储每个path 对应的 streams
const infos: { [key: string]: Stream[]; } = {};

export async function getMediaInfo(path: string) {
  try {
    return mediaInfoQueue.getMediaInfo(path);
  } catch (error) {
    log.error('[MediaTask|MediaInfo]', error);
    return undefined;
  }
}
export async function getFormat(path: string) {
  const info = await getMediaInfo(path);
  return info && info.format;
}
export async function getStreams(path: string) {
  if (infos[path]) return infos[path];
  const info = await getMediaInfo(path);
  infos[path] = (info && info.streams) || [];
  return infos[path];
}
export async function getSubtitleStreams(path: string) {
  return (await getStreams(path))
    .filter(({ codecType }) => codecType === CodecType.Subtitle) as ISubtitleStream[];
}
export { ISubtitleStream } from './mediaInfoQueue';

export async function getSnapshotPath(
  videoPath: string,
  timeInSeconds: number,
  width: number = 1920, height: number = 1080,
) {
  try {
    return snapshotQueue.getSnapshotPath(
      videoPath,
      timeInSeconds,
      width, height,
    );
  } catch (error) {
    log.error('[MediaTask|Snapshot]', error);
    return '';
  }
}

export async function getSubtitleMetadata(videoPath: string, streamIndex: number, format: Format) {
  try {
    return subtitleQueue.getSubtitleMetadata(videoPath, streamIndex, format);
  } catch (error) {
    log.error('[MediaTask|SubtitleMetadata]', error);
    return '';
  }
}
export async function cacheSubtitle(videoPath: string, streamIndex: number) {
  try {
    return subtitleQueue.cacheSubtitle(videoPath, streamIndex);
  } catch (error) {
    log.error('[MediaTask|SubtitleCache]', error);
    return '';
  }
}
export async function getSubtitleFragment(
  videoPath: string,
  streamIndex: number,
  videoTime: number,
) {
  try {
    return subtitleQueue.getSubtitleFragment(videoPath, streamIndex, videoTime);
  } catch (error) {
    log.error('[MediaTask|SubtitleFragment]', error);
    return '';
  }
}
export async function finishSubtitleExtraction(videoPath: string, streamIndex: number) {
  try {
    subtitleQueue.stopSubtitleExtraction(videoPath, streamIndex);
  } catch (error) {
    log.error('[MediaTask|SubtitleFragment]', error);
  }
}

/**
 * 获取进度条缩略图路径
 * 缩略图每秒一张，放在一行拼在一个图片文件里
 * @param videoPath 视频路径
 * @param width 单个缩略图宽度
 * @param duration 视频时长（秒）
 * @param screenWidth 屏幕宽度
 * @param maxThumbnailCount 最大缩略图数量（出于性能考虑）
 */
export async function getThumbnailPath(
  videoPath: string, interval: number, width: number, cols: number,
) {
  try {
    return thumbnailQueue.getThumbnailPath(
      videoPath,
      interval,
      width,
      cols,
    );
  } catch (error) {
    log.error('[MediaTask|Thumbnail]', error);
    return undefined;
  }
}
