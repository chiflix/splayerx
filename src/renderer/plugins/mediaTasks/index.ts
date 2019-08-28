import MediaInfoQueue, { CodecType, ISubtitleStream } from './mediaInfoQueue';
import SnapshotSubtitleQueue from './snapshotSubtitleQueue';
import ThumbnailQueue from './thumbnailQueue';
import { Format } from '@/interfaces/ISubtitle';
import { log } from '@/libs/Log';

const mediaInfoQueue = new MediaInfoQueue();
const snapshotSubtitleQueue = new SnapshotSubtitleQueue();
const thumbnailQueue = new ThumbnailQueue();

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
  const info = await getMediaInfo(path);
  return (info && info.streams) || [];
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
    return snapshotSubtitleQueue.getSnapshotPath(
      videoPath,
      timeInSeconds,
      width, height,
    );
  } catch (error) {
    log.error('[MediaTask|Snapshot]', error);
    return '';
  }
}
export async function getSubtitlePath(videoPath: string, streamIndex: number, format: Format) {
  try {
    return snapshotSubtitleQueue.getSubtitlePath(videoPath, streamIndex, format);
  } catch (error) {
    log.error('[MediaTask|Subtitle]', error);
    return '';
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
    return '';
  }
}
