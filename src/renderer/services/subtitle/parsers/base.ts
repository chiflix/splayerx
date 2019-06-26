import { Parser, Entity, Format, Cue, Tags } from '@/interfaces/ISubtitle';
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
  async parse() { }
}

/**
 * @description dialogue转cue
 * @param {Dialogue} dialogue
 * @returns {Cue}
 */
function dialogues2Cues(dialogue: Dialogue): Cue {
  if (dialogue && !dialogue.text && dialogue.fragments) {
    let txt = '';
    let tags: Tags = {} as Tags;
    dialogue.fragments.forEach((e: { text: string, tags: Tags }, i: number) => {
      if (i === 0) {
        tags = e.tags;
      }
      txt += e.text
    });
    return {
      start: dialogue.start,
      end: dialogue.end,
      text: txt,
      tags,
    }
  } else if (dialogue && dialogue.text && dialogue.tags) {
    const tags = dialogue.tags ? dialogue.tags : {} as Tags;
    return {
      start: dialogue.start,
      end: dialogue.end,
      text: dialogue.text,
      tags,
    }
  } else {
    return {} as Cue;
  }
}

function getDialogues(dialogues: Dialogue[], time?: number) {
  return typeof time === 'undefined' ? dialogues.map(dialogues2Cues) :
    dialogues.filter(({ start, end, text, fragments }) => (
      (start <= time && end >= time) &&
      (!!text || !!fragments)
    )).map(dialogues2Cues);
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
