import { IRawSubtitle, IDialogue } from './index';
import { parse, toMS } from 'subtitle';

type ParsedSubtitle = {
  start: number;
  end: number;
  text: string;
  settings: string;
}[];

export class VttSubtitle implements IRawSubtitle {
  payload = '';
  constructor(vttString: string) {
    this.payload = vttString;
  }
  private baseTags = {
    // https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API#Cue_settings
    vertical: '',
    line: '',
    position: '',
    // size: '',
    // align: '',
  };
  private normalizer(parsedSubtitle: ParsedSubtitle) {
    const finalDialogues: IDialogue[] = [];
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
    return {
      info: {},
      dialogues: finalDialogues,
    };
  }
  async parse() {
    return this.normalizer(parse(this.payload));
  }
}
