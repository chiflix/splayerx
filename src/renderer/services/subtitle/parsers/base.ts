import { Parser, Entity, Format } from '@/interfaces/ISubtitle';
import { Dialogue } from '@/interfaces/ISubtitle';

export class BaseParser implements Parser {
  readonly payload: any;
  info = {};
  dialogues: Dialogue[];

  async getInfo() { return this.info; }
  async getDialogues(time?: number) {
    return getDialogues(this.dialogues, time);
  }
  async getVideoSegments(duration: number) {
    return calculateVideoSegments(this.dialogues, duration);
  }
  async parse() {}
}

function getDialogues(dialogues: Dialogue[], time?: number) {
  return typeof time === 'undefined' ? dialogues :
    dialogues.filter(({ start, end, text, fragments }) => (
      (start <= time && end >= time) &&
      (!!text || !!fragments)
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
  return result.map((segment) => ({ ...segment, played: false }));
}
