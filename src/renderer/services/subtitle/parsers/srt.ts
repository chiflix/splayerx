import { IRawSubtitle, IDialogue } from './index';
// @ts-ignore
import { parse, toMS } from 'subtitle';
import { tagsGetter } from '../utils';

type ParsedSubtitle = {
  start: string;
  end: string;
  text: string;
}[];

export class SrtSubtitle implements IRawSubtitle {
  payload = '';
  constructor(srtPayload: string) {
    this.payload = srtPayload;
  }
  private baseTags = { alignment: 2, pos: undefined };
  private normalizer(parsedSubtitle: ParsedSubtitle) {
    const finalDialogues: IDialogue[] = [];
    parsedSubtitle.forEach((subtitle) => {
      finalDialogues.push({
        start: toMS(subtitle.start) / 1000,
        end: toMS(subtitle.end) / 1000,
        tags: tagsGetter(subtitle.text, this.baseTags),
        text: subtitle.text.replace(/\{[^{}]*\}/g, '').replace(/[\\/][Nn]|\r?\n|\r/g, '\n'),
      });
    });
    return {
      info: {},
      dialogues: finalDialogues,
    };
  }
  async parse() {
    return this.normalizer(parse(this.payload));
  }
}
