import { pick, get } from 'lodash';
import { compile, CompiledASS, AssStream } from 'ass-compiler';
import {
  Format, IParser, ILoader, IMetadata, TextCue, IVideoSegments,
} from '@/interfaces/ISubtitle';
import { getDialogues } from '../utils';
import { StreamTimeSegments } from '@/libs/TimeSegments';

export class AssParser implements IParser {
  public get format() { return Format.AdvancedSubStationAplha; }

  public readonly loader: ILoader;

  public readonly videoSegments: IVideoSegments;

  public constructor(assPayload: ILoader, videoSegments: IVideoSegments) {
    this.loader = assPayload;
    this.videoSegments = videoSegments;
    this.loader.once('read', (result) => {
      if (result) {
        this.loader.getPayload()
          .then((payload) => {
            this.dialogues = [];
            this.normalize(compile(payload as string));
            // some clean up
            if (this.timer) clearTimeout(this.timer);
            this.assStream = undefined;
            this.timeSegments = undefined;
          });
      }
    });
  }

  private baseInfo = {
    // Title: '',
    // ScriptType: '',
    // WrapStyle: '',
    PlayResX: '',
    PlayResY: '',
    // ScaledBorderAndShadow: 'yes',
    // 'Last Style Storage': 'Default',
    // 'Video File': '',
    // 'Video Aspect Ratio': '0',
    // 'Video Zoom': '8',
    // 'Video Position': '0',
  };

  private baseTags = {
    // fn: '',
    // fs: '',
    // c1: '',
    // a1: '',
    // c2: '',
    // a2: '',
    // c3: '',
    // a3: '',
    // c4: '',
    // a4: '',
    b: 0,
    i: 0,
    u: 0,
    s: 0,
    // fscx: 100,
    // fscy: 100,
    // fsp: 0,
    // frz: 0,
    // xbord: 2,
    // ybord: 2,
    // xshad: 2,
    // yshad: 2,
    // q: 0,
    alignment: 2,
    pos: undefined,
  };

  private metadata: IMetadata;

  private dialogues: TextCue[] = [];

  private normalize(compiledSubtitle: CompiledASS) {
    if (!compiledSubtitle.dialogues.length) return;
    const { info, dialogues } = compiledSubtitle;
    this.metadata = pick(info, Object.keys(this.baseInfo));
    this.dialogues = dialogues.map((dialogue) => {
      const {
        start, end, alignment, slices, pos,
      } = dialogue;
      const finalText = slices
        .reduce(
          (prevSliceString, { fragments }) => prevSliceString.concat(fragments
            .reduce(
              (prevFragmentString, { text }) => prevFragmentString.concat(text
                // replace soft and hard line breaks with \n
                .replace(/[\\/][Nn]|\r?\n|\r/g, '\n')
                // replace hard space with space
                .replace(/\\h/g, ' ')),
              '',
            )),
          '',
        );
      const finalTags = {
        ...this.baseTags,
        alignment,
        pos,
        ...pick(
          Object.assign({},
            get(slices, '[0].tag'),
            get(slices, '[0].fragments[0].tag')),
          ['b', 'i', 'u', 's'],
        ),
      };
      return {
        start,
        end,
        text: finalText,
        tags: finalTags,
        format: Format.AdvancedSubStationAplha,
      };
    });
    this.dialogues.forEach(({ start, end }) => this.videoSegments.insert(start, end));
  }

  public async getMetadata() { return this.metadata; }

  private assStream?: AssStream;

  private timeSegments?: StreamTimeSegments;

  private timer?: NodeJS.Timeout;

  private timeout: boolean = true;

  private currentTime?: number;

  private isRequesting: boolean = false;

  private get canRequestPayload() {
    return !this.loader.canPreload && !this.isRequesting && (
      (this.timeSegments && !this.timeSegments.check(this.currentTime || 0)) || this.timeout
    );
  }

  private lastLines: string[] = [];

  public async getDialogues(time?: number) {
    if (this.loader.canPreload) {
      if (!this.loader.fullyRead) {
        const payload = await this.loader.getPayload() as string;
        if (this.loader.fullyRead) {
          this.normalize(compile(payload));
        }
      }
    } else if (!this.loader.fullyRead) {
      this.currentTime = time || 0;
      if (this.canRequestPayload) {
        if (this.timer) clearTimeout(this.timer);
        this.timeout = false;
        this.timer = setTimeout(() => { this.timeout = true; }, 10000);
        this.isRequesting = true;
        const payload = await this.loader.getPayload(time) as string || '';
        const newLines = payload.split(/\r?\n/);
        const deDuplicatedPayload = newLines.filter(line => !this.lastLines.includes(line)).join('\n');
        this.lastLines = newLines;
        if (!this.assStream) this.assStream = new AssStream();
        const result = this.assStream.compile(deDuplicatedPayload);
        if (!this.timeSegments) this.timeSegments = new StreamTimeSegments();
        this.timeSegments.bulkInsert(result.map(({ Start, End }) => [Start, End]), time || 0);
        this.normalize(this.assStream.compiled);
        this.isRequesting = false;
      }
    }
    return getDialogues(this.dialogues, time);
  }
}
