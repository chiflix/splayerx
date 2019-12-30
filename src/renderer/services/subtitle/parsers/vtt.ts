// @ts-ignore
import { parse, toMS } from '@splayer/subtitle';
import {
  Format, Cue, IParser, IVideoSegments,
} from '@/interfaces/ISubtitle';
import { tagsGetter, getDialogues } from '../utils';
import { LocalTextLoader } from '../utils/loaders';

type ParsedSubtitle = {
  start: number;
  end: number;
  text: string;
  settings: string;
}[];

export class VttParser implements IParser {
  public get format() { return Format.SubRip; }

  public readonly loader: LocalTextLoader;

  public readonly videoSegments: IVideoSegments;

  public constructor(textLoader: LocalTextLoader, videoSegments: IVideoSegments) {
    this.loader = textLoader;
    this.videoSegments = videoSegments;
  }

  public async getMetadata() { return { PlayResX: '', PlayResY: '' }; }

  private dialogues: Cue[] = [];

  private baseTags = { alignment: 2, pos: undefined };

  private normalizer(parsedSubtitle: ParsedSubtitle) {
    if (!parsedSubtitle.length) throw new Error('Unsupported Subtitle');
    const finalDialogues: Cue[] = [];
    parsedSubtitle
      .filter(({ text }) => text)
      .forEach((subtitle) => {
        finalDialogues.push({
          start: toMS(subtitle.start) / 1000,
          end: toMS(subtitle.end) / 1000,
          tags: tagsGetter(subtitle.text, this.baseTags),
          text: subtitle.text
            .replace(/<\/?[^bius]+?>/g, '')
            .replace(/\{[^{}]*\}/g, '')
            .replace(/[\\/][Nn]|\r?\n|\r/g, '\n'),
          format: this.format,
        });
      });
    this.dialogues = finalDialogues;
    this.dialogues.forEach(({ start, end }) => this.videoSegments.insert(start, end));
  }

  public async getDialogues(time?: number) {
    if (!this.loader.fullyRead) {
      const payload = await this.loader.getPayload() as string;
      if (this.loader.fullyRead) this.normalizer(parse(payload));
    }
    return getDialogues(this.dialogues, time);
  }
}
