import MediaInfoQueue, { CodecType, ISubtitleStream } from './mediaInfoQueue';
import SnapshotQueue from './snapshotQueue';
import SubtitleQueue from './subtitleQueue';
import ThumbnailQueue from './thumbnailQueue';
import { log } from '@/libs/Log';

const mediaInfoQueue = new MediaInfoQueue();
const snapshotQueue = new SnapshotQueue();
const subtitleQueue = new SubtitleQueue();
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
export async function getSubtitlePath(videoPath: string, streamIndex: number) {
  try {
    return subtitleQueue.getSubtitlePath(videoPath, streamIndex);
  } catch (error) {
    log.error('[MediaTask|Subtitle]', error);
    return '';
  }
}

export async function getThumbnailPath(
  videoPath: string,
  width: number,
  rowCount: number, columnCount: number,
) {
  try {
    return thumbnailQueue.getThumbnailPath(
      videoPath,
      width,
      rowCount, columnCount,
    );
  } catch (error) {
    log.error('[MediaTask|Thumbnail]', error);
    return '';
  }
}
