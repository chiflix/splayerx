import { Dialogue } from '@/interfaces/ISubtitle';
import { BaseParser } from './base';
// @ts-ignore
import { parse, toMS } from 'subtitle';

type ParsedSubtitle = {
  start: number;
  end: number;
  text: string;
  settings: string;
}[];

export class VttParser extends BaseParser {
  readonly payload: string = '';
  constructor(vttString: string) {
    super();
    this.payload = vttString;
  }
  dialogues: Dialogue[];
  private baseTags = {
    // https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API#Cue_settings
    vertical: '',
    line: '',
    position: '',
    // size: '',
    // align: '',
  };
  private normalizer(parsedSubtitle: ParsedSubtitle) {
    const finalDialogues: Dialogue[] = [];
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
      });
    });
    this.dialogues = finalDialogues;
  }
  async parse() {
    this.normalizer(parse(this.payload));
  }
}
