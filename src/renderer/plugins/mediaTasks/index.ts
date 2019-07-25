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
