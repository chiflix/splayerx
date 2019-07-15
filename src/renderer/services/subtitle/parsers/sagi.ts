import { TranscriptResponse } from 'sagi-api/translation/v1/translation_pb';
import { Format, Cue } from '@/interfaces/ISubtitle';
import { BaseParser } from './base';
import { tagsGetter } from '../utils';

export type SagiSubtitlePayload = TranscriptResponse.Cue.AsObject[];

export class SagiParser extends BaseParser {
  payload: SagiSubtitlePayload;

  format = Format.Sagi;

  constructor(sagiPayload: SagiSubtitlePayload) {
    super();
    this.payload = sagiPayload;
  }

  dialogues: Cue[] = [];

  private baseTags = { alignment: 2, pos: undefined };

  private normalizer(parsedSubtitle: SagiSubtitlePayload) {
    const finalDialogues: Cue[] = [];
    parsedSubtitle.forEach(({ startTime, endTime, text }) => {
      finalDialogues.push({
        start: startTime,
        end: endTime,
        text: text
          .replace(/[\\/][Nn]|\r?\n|\r/g, '\n') // replace soft and hard line breaks with \n
          .replace(/\\h/g, ' '), // replace hard space with space
        tags: tagsGetter(text, this.baseTags),
        format: this.format,
      });
    });
    this.dialogues = finalDialogues;
  }

  async parse() {
    this.normalizer(this.payload);
  }
}
