import { MediaInfoQueue } from './mediaInfoQueue';
import { SnapshotSubtitleQueue } from './snapshotSubtitleQueue';
import { ThumbnailQueue } from './thumbnailQueue';
import { Format } from '@/interfaces/ISubtitle';

const mediaInfoQueue = new MediaInfoQueue();
const snapshotSubtitleQueue = new SnapshotSubtitleQueue();
const thumbnailQueue = new ThumbnailQueue();

export function getMediaInfo(path: string) {
  return mediaInfoQueue.getMediaInfo(path);
}
export function getFormat(path: string) {
  return mediaInfoQueue.getFormat(path);
}
export function getStreams(path: string) {
  return mediaInfoQueue.getStreams(path);
}
export function getSubtitleStreams(path: string) {
  return mediaInfoQueue.getSubtitleStreams(path);
}
export { ISubtitleStream } from './mediaInfoQueue';

export function getSnapshotPath(
  videoPath: string,
  timeInSeconds: number,
  width: number = 1920, height: number = 1080,
) {
  return snapshotSubtitleQueue.getSnapshotPath(
    videoPath,
    timeInSeconds,
    width, height,
  );
}
export function getSubtitlePath(videoPath: string, streamIndex: number, format: Format) {
  return snapshotSubtitleQueue.getSubtitlePath(videoPath, streamIndex, format);
}

export function getThumbnailPath(
  videoPath: string,
  width: number,
  rowCount: number, columnCount: number,
) {
  return thumbnailQueue.getThumbnailPath(
    videoPath,
    width,
    rowCount, columnCount,
  );
}
