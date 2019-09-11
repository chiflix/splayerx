import { TranscriptResponse } from 'sagi-api/translation/v1/translation_pb';
import {
  Format, Cue, IParser, IVideoSegments,
} from '@/interfaces/ISubtitle';
import { tagsGetter, getDialogues } from '../utils';
import { SagiLoader } from '../utils/loaders';

export type SagiSubtitlePayload = TranscriptResponse.Cue.AsObject[];

export class SagiParser implements IParser {
  public get format() { return Format.Sagi; }

  public readonly loader: SagiLoader;

  public readonly videoSegments: IVideoSegments;

  public constructor(loader: SagiLoader, videoSegments: IVideoSegments) {
    this.loader = loader;
    this.videoSegments = videoSegments;
  }

  public async getMetadata() { return { PlayResX: '', PlayResY: '' }; }

  private dialogues: Cue[] = [];

  private baseTags = { alignment: 2, pos: undefined };

  private normalizer(parsedSubtitle: SagiSubtitlePayload) {
    const finalDialogues: Cue[] = [];
    parsedSubtitle = Array.isArray(parsedSubtitle) ? parsedSubtitle : [];
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
    this.dialogues.forEach(({ start, end }) => this.videoSegments.insert(start, end));
  }

  public async getDialogues(time?: number) {
    if (!this.loader.fullyRead) {
      const payload = await this.loader.getPayload() as SagiSubtitlePayload;
      if (this.loader.fullyRead) this.normalizer(payload);
    }
    return getDialogues(this.dialogues, time);
  }
}
