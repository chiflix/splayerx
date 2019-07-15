import { isEqual } from 'lodash';
import {
  Parser, Format, Cue, VideoSegment, Dialogue,
} from '@/interfaces/ISubtitle';


export class BaseParser implements Parser {
  readonly payload: any;

  metadata = {};

  dialogues: Cue[];

  format: Format = Format.Unknown;

  async getMetadata() { return this.metadata; }

  async getDialogues(time?: number) {
    return getDialogues(this.dialogues, time);
  }

  private videoSegments: VideoSegment[];

  async getVideoSegments(duration: number) {
    if (this.videoSegments) return this.videoSegments;
    return this.videoSegments = calculateVideoSegments(this.dialogues, duration);
  }

  private lastSegment: VideoSegment;

  private lastSegmentPlayedTime: number = 0;

  updateVideoSegments(lastTime: number, currentTime: number) {
    const { videoSegments, lastSegment } = this;
    const currentSegment = videoSegments.find(segment => segment.start <= currentTime && segment.end > currentTime);
    if (currentSegment && !currentSegment.played) {
      if (isEqual(currentSegment, lastSegment)) {
        this.lastSegmentPlayedTime += currentTime - lastTime;
      } else {
        const segmentTime = currentSegment.end - currentSegment.start;
        if (this.lastSegmentPlayedTime / segmentTime >= 0.9) {
          const index = videoSegments.findIndex(segment => isEqual(segment, currentSegment));
          if (index) videoSegments[index] = { ...currentSegment, played: true };
        }
      }
      this.lastSegment = currentSegment;
    }
    return videoSegments
      .filter(({ played }) => played)
      .map(({ end, start }) => end - start)
      .reduce((playedTime, currentSegmentTime) => playedTime += currentSegmentTime, 0);
  }

  async parse() { }
}

function getDialogues(dialogues: Cue[], time?: number) {
  return typeof time === 'undefined' ? dialogues
    : dialogues.filter(({ start, end, text }) => (
      (start <= time && end >= time) && !!text
    ));
}

function calculateVideoSegments(dialogues: Dialogue[], duration: number) {
  const subtitleSegments = dialogues
    .filter(({ text }) => !!text)
    .map(({ start, end }) => ({ start, end }))
    .sort((a, b) => a.start - b.start);
  const result = [{ start: 0, end: 0 }];
  let currentIndex = 0;
  while (duration && result[result.length - 1].end !== duration) {
    const lastElement = result[result.length - 1];
    if (currentIndex < subtitleSegments.length) {
      if (lastElement.end <= subtitleSegments[currentIndex].start) {
        [lastElement.end] = [subtitleSegments[currentIndex].start];
        result.push(subtitleSegments[currentIndex]);
        currentIndex += 1;
      } else {
        currentIndex += 1;
      }
    } else {
      lastElement.end = duration;
    }
  }
  return result.map(segment => ({ ...segment, played: false }));
}
