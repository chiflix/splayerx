// @ts-ignore
import { parse, toMS } from 'subtitle';
import { Format, Cue } from '@/interfaces/ISubtitle';
import { BaseParser } from './base';
import { tagsGetter } from '../utils';

type ParsedSubtitle = {
  start: string;
  end: string;
  text: string;
}[];

export class SrtParser extends BaseParser {
  public payload = '';

  public format = Format.SubRip;

  public constructor(srtPayload: string) {
    super();
    this.payload = srtPayload;
  }

  public dialogues: Cue[];

  private baseTags = { alignment: 2, pos: undefined };

  private normalizer(parsedSubtitle: ParsedSubtitle) {
    if (!parsedSubtitle.length) throw new Error('Unsupported Subtitle');
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

  public async parse() {
    this.normalizer(parse(this.payload));
  }
}
