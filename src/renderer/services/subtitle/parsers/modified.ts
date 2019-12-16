import {
  Format, Cue, IParser, IVideoSegments, IMetadata,
} from '@/interfaces/ISubtitle';
import { getDialogues } from '../utils';
import { ModifiedLoader } from '../utils/loaders';

type ParsedSubtitle = Cue[];

export class ModifiedParser implements IParser {
  public get format() { return Format.SubRip; }

  public readonly loader: ModifiedLoader;

  public readonly videoSegments: IVideoSegments;

  public constructor(loader: ModifiedLoader, videoSegments: IVideoSegments) {
    this.loader = loader;
    this.videoSegments = videoSegments;
  }

  public async getMetadata() { return this.meta || { PlayResX: '', PlayResY: '' }; }

  private dialogues: Cue[] = [];

  private meta: IMetadata;

  private baseTags = { alignment: 2, pos: undefined };

  private normalizer(parsedSubtitle: ParsedSubtitle) {
    const finalDialogues: Cue[] = [];
    parsedSubtitle
      .filter(({ text }) => text)
      .forEach((subtitle) => {
        finalDialogues.push({
          start: subtitle.start,
          end: subtitle.end,
          tags: subtitle.tags,
          text: subtitle.text,
          format: this.format,
        });
      });
    this.dialogues = finalDialogues;
    this.dialogues.forEach(({ start, end }) => this.videoSegments.insert(start, end));
  }

  public async getDialogues(time?: number) {
    if (!this.loader.fullyRead) {
      const payload = await this.loader.getPayload() as string;
      let dialogues: Cue[] = [];
      try {
        const data = JSON.parse(payload);
        dialogues = data.dialogues;
        this.meta = data.meta;
      } catch (error) {
        // empty
      }
      if (this.loader.fullyRead) this.normalizer(dialogues);
    }
    return getDialogues(this.dialogues, time);
  }

  public saveDialogues(dialogues: Cue[]) {
    this.dialogues = dialogues;
    const meta = this.getMetadata();
    try {
      (this.loader as ModifiedLoader).save(JSON.stringify({ dialogues, meta }));
    } catch (error) {
      // empty
    }
  }
}
