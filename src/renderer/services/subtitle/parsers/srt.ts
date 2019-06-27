import { Dialogue, Format, Cue } from '@/interfaces/ISubtitle';
import { BaseParser } from './base';
// @ts-ignore
import { parse, toMS } from 'subtitle';
import { tagsGetter } from '../utils';

type ParsedSubtitle = {
  start: string;
  end: string;
  text: string;
}[];

export class SrtParser extends BaseParser {
  payload = '';
  format = Format.SubRip;
  constructor(srtPayload: string) {
    super();
    this.payload = srtPayload;
  }
  dialogues: Cue[];
  private baseTags = { alignment: 2, pos: undefined };
  private normalizer(parsedSubtitle: ParsedSubtitle) {
    const finalDialogues: Cue[] = [];
    parsedSubtitle.forEach((subtitle) => {
      finalDialogues.push({
        start: toMS(subtitle.start) / 1000,
        end: toMS(subtitle.end) / 1000,
        tags: tagsGetter(subtitle.text, this.baseTags),
        text: subtitle.text.replace(/\{[^{}]*\}/g, '').replace(/[\\/][Nn]|\r?\n|\r/g, '\n'),
        format: this.format,
      });
    });
    this.dialogues = finalDialogues;
  }
  async parse() {
    this.normalizer(parse(this.payload));
  }
}
