import { isEqual } from 'lodash';
import {
  IParser, Format, Cue, IVideoSegment, IDialogue,
} from '@/interfaces/ISubtitle';

function getDialogues(dialogues: Cue[], time?: number) {
  return typeof time === 'undefined' ? dialogues
    : dialogues.filter(({ start, end, text }) => (
      (start <= time && end >= time) && !!text
    ));
}

function calculateVideoSegments(dialogues: IDialogue[], duration: number) {
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

export class BaseParser implements IParser {
  public readonly payload: unknown;

  public metadata = {};

  public dialogues: Cue[];

  public format: Format = Format.Unknown;

  public async getMetadata() { return this.metadata; }

  public async getDialogues(time?: number) {
    return getDialogues(this.dialogues, time);
  }

  private videoSegments: IVideoSegment[];

  public async getVideoSegments(duration: number) {
    if (this.videoSegments) return this.videoSegments;
    this.videoSegments = calculateVideoSegments(this.dialogues, duration);
    return this.videoSegments;
  }

  private lastSegment: IVideoSegment;

  private lastSegmentPlayedTime: number = 0;

  public updateVideoSegments(lastTime: number, currentTime: number) {
    const { videoSegments, lastSegment } = this;
    const currentSegment = videoSegments
      .find(segment => segment.start <= currentTime && segment.end > currentTime);
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
      .reduce((playedTime, currentSegmentTime) => {
        playedTime += currentSegmentTime;
        return playedTime;
      }, 0);
  }

  // eslint-disable-next-line
  public async parse() {}
}
