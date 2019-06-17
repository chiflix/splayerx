import { IRawSubtitle, IDialogue, SagiSubtitlePayload } from './index';
import { tagsGetter } from '../utils';

export class SagiSubtitle implements IRawSubtitle {
  payload: SagiSubtitlePayload;
  constructor(sagiPayload: SagiSubtitlePayload) {
    this.payload = sagiPayload;
  }
  private baseTags = { alignment: 2, pos: undefined };
  private normalizer(parsedSubtitle: SagiSubtitlePayload) {
    const finalDialogues: IDialogue[] = [];
    parsedSubtitle.forEach(({ startTime, endTime, text }) => {
      finalDialogues.push({
        start: startTime,
        end: endTime,
        text: text
          .replace(/[\\/][Nn]|\r?\n|\r/g, '\n') // replace soft and hard line breaks with \n
          .replace(/\\h/g, ' '), // replace hard space with space
        tags: tagsGetter(text, this.baseTags),
      });
    });
    return {
      info: {},
      dialogues: finalDialogues,
    };
  }
  async parse() {
    return this.normalizer(this.payload);
  }
}
