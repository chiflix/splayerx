// @ts-ignore
import { parse, toMS } from 'subtitle';
import { Format, Cue } from '@/interfaces/ISubtitle';
import { BaseParser } from './base';

type ParsedSubtitle = {
  start: number;
  end: number;
  text: string;
  settings: string;
}[];

export class VttParser extends BaseParser {
  public readonly payload: string = '';

  public format = Format.WebVTT;

  public constructor(vttString: string) {
    super();
    this.payload = vttString;
  }

  public dialogues: Cue[];

  private baseTags = {
    // https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API#Cue_settings
    vertical: '',
    line: '',
    position: '',
    // size: '',
    // align: '',
  };

  private normalizer(parsedSubtitle: ParsedSubtitle) {
    if (!parsedSubtitle.length) throw new Error('Unsupported Subtitle');
    const finalDialogues: Cue[] = [];
    parsedSubtitle.forEach((subtitle) => {
      finalDialogues.push({
        start: toMS(subtitle.start) / 1000,
        end: toMS(subtitle.end) / 1000,
        text: subtitle.text.replace(/\{[^{}]*\}/g, '').replace(/[\\/][Nn]|\r?\n|\r/g, '\n'),
        tags: !subtitle.settings ? this.baseTags : {
          ...this.baseTags,
          ...subtitle.settings
            .split(' ')
            .reduce(
              (accu: {}, curr: string) => ({
                ...accu,
                [curr.split(':')[0]]: curr.split(':')[1],
              }),
              {},
            ),
        },
        format: this.format,
      });
    });
    this.dialogues = finalDialogues;
  }

  public async parse() {
    this.normalizer(parse(this.payload));
  }
}
