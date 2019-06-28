import { Dialogue, Format, Cue, Tags } from '@/interfaces/ISubtitle';
import { BaseParser } from './base';
import { pick } from 'lodash';
// @ts-ignore
import { compile } from 'ass-compiler';

interface IAssTags {
  b: number;
  i: number;
  u: number;
  s: number;
}
type CompiledSubtitle = {
  info: {
    PlayResX: string;
    PlayResY: string;
  };
  dialogues: {
    start: number;
    end: number;
    alignment: number;
    pos: {
      x: number;
      y: number;
    };
    slices: {
      tag: IAssTags;
      fragments: {
        tag: IAssTags;
        text: string;
        drawing: null | object;
      }[];
    }[];
  }[];
}

export class AssParser extends BaseParser {
  readonly payload: string = '';
  format = Format.AdvancedSubStationAplha;
  constructor(assPayload: string) {
    super();
    this.payload = assPayload;
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
    pos: null,
  };
  private normalize(compiledSubtitle: CompiledSubtitle) {
    if (!compiledSubtitle.dialogues.length) throw new Error('Unsupported Subtitle');
    const finalDialogues: Cue[] = [];
    const { info, dialogues } = compiledSubtitle;
    this.info = pick(info, Object.keys(this.baseInfo));
    dialogues.forEach((dialogue) => {
      const {
        start, end, alignment, slices, pos,
      } = dialogue;
      const baseDiagolue = {
        start, end,
      };
      Object.values(slices).forEach((slice) => {
        const { tag: sliceTag, fragments } = slice;
        const hasDrawing = fragments.some(({ drawing }) => !!drawing);
        if (!hasDrawing) {
          const processedFragments = fragments.map((fragment) => {
            const { tag: fragmentTag, text } = fragment;
            const finalTags = {
              ...this.baseTags,
              alignment,
              pos,
              ...pick(Object.assign({}, sliceTag, fragmentTag), ['b', 'i', 'u', 's']),
            };
            return {
              text: text
                .replace(/[\\/][Nn]|\r?\n|\r/g, '\n') // replace soft and hard line breaks with \n
                .replace(/\\h/g, ' '), // replace hard space with space
              tags: finalTags,
            };
          });
          let txt = '';
          let tags: Tags = {} as Tags;
          processedFragments.forEach((f: { text: string, tags: Tags }, i: number) => {
            if (i === 0) {
              tags = f.tags;
            }
            txt += f.text;
          })
          const finalDialogue = {
            ...baseDiagolue,
            text: txt,
            tags,
            format: this.format,
          };
          finalDialogues.push(finalDialogue);
        }
      });
    });
    this.dialogues = finalDialogues;
  }
  async parse() {
    this.normalize(compile(this.payload) as CompiledSubtitle);
  }
}
