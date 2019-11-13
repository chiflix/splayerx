import { isEqual } from 'lodash';
import {
  IParser, Format, IVideoSegments, ImageCue, ILoader,
} from '@/interfaces/ISubtitle';
import { StreamTimeSegments } from '@/libs/TimeSegments';

interface IInternalImageCue {
  start: number;
  end: number;
  payloadPosition: [number, number];
  format: Format;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
export class SagiImageParser implements IParser {
  public get format() { return Format.SagiImage; }

  public readonly loader: ILoader;

  public readonly videoSegments: IVideoSegments;

  private payload: Buffer;

  public constructor(loader: ILoader, videoSegments: IVideoSegments) {
    this.loader = loader;
    this.videoSegments = videoSegments;
    this.loader.once('read', (result) => {
      if (result) {
        this.loader.getPayload()
          .then((payload) => {
            if (payload) {
              this.payload = payload as Buffer;
              this.offset = 0;
              this.metadataString = this.parseMetadata(this.payload);
              this.dialogues = this.parseDialogues(this.payload);
              // some clean up
              if (this.timer) clearTimeout(this.timer);
              this.timeSegments = undefined;
              this.offset = 0;
            }
          });
      }
    });
  }

  public async getMetadata() { return {}; }

  private dialogues: (IInternalImageCue | ImageCue)[] = [];

  private offset = 0;

  private metadataString = '';

  private parseMetadata(data: Buffer, offset?: number) {
    let actualOffset = typeof offset === 'undefined' ? this.offset : offset;

    const metadataSize = data.readUInt32LE(actualOffset);
    const actualSize = data.length > metadataSize + 4 ? metadataSize : data.length - 4;
    actualOffset += 4;
    this.metadataString = data.subarray(actualOffset, actualOffset + actualSize).toString('utf8');
    actualOffset += actualSize;

    const useInternalOffset = typeof offset === 'undefined';
    if (useInternalOffset) this.offset = actualOffset;
    return this.metadataString;
  }

  private parseDialogues(data: Buffer, offset?: number) {
    let actualOffset = typeof offset === 'undefined' ? this.offset : offset;
    const { length } = data;
    const result: (ImageCue | IInternalImageCue)[] = [];

    while (actualOffset < length) {
      const start = data.readUInt32LE(actualOffset) / 100;
      actualOffset += 4;
      const end = data.readUInt32LE(actualOffset) / 100;
      actualOffset += 4;
      const width = data.readInt32LE(actualOffset);
      actualOffset += 4;
      const height = data.readInt32LE(actualOffset);
      actualOffset += 4;
      const x = data.readInt32LE(actualOffset);
      actualOffset += 4;
      const y = data.readInt32LE(actualOffset);
      actualOffset += 4;
      const pngSize = data.readInt32LE(actualOffset);
      actualOffset += 4;
      const actualPngSize = length > actualOffset + pngSize ? pngSize : length - actualOffset;
      const partialImageCue = {
        start,
        end,
        format: this.format,
        position: {
          x, y, width, height,
        },
      };

      if (!result.length && this.dialogues.length) {
        const { start: oldStart, end: oldEnd } = this.dialogues[this.dialogues.length - 1];
        if (oldStart <= start && oldEnd >= start) {
          this.dialogues[this.dialogues.length - 1].end = start;
        }
      } else if (result.length) {
        const { start: oldStart, end: oldEnd } = result[result.length - 1];
        if (oldStart <= start && oldEnd >= start) result[result.length - 1].end = start;
      }

      const usePayloadPosition = data === this.payload;
      if (usePayloadPosition) {
        result.push({
          ...partialImageCue,
          payloadPosition: [actualOffset, actualOffset + actualPngSize],
        });
      } else {
        result.push({
          ...partialImageCue,
          payload: data.subarray(actualOffset, actualOffset + actualPngSize),
        });
      }
      actualOffset += actualPngSize;
    }

    const useInternalOffset = typeof offset === 'undefined';
    if (useInternalOffset) this.offset = actualOffset;

    return result;
  }

  private addDialogues(dialogues: (IInternalImageCue | ImageCue)[]) {
    const notExistedDialogues = dialogues
      .filter(({ start, end, position }) => !this.dialogues.some(dialogue => (
        dialogue.start === start && (dialogue.end === end || isEqual(position, dialogue.position))
      )));
    // remove last segment's abnormal end timestamp (mainly for pgs subtitles)
    if (this.dialogues.length && notExistedDialogues.length) {
      const lastSegment = this.dialogues[this.dialogues.length - 1];
      const { start: lastStart, end: lastEnd } = lastSegment;
      const { start: firstStart } = notExistedDialogues[0];
      if (lastStart <= firstStart && lastEnd > firstStart) lastSegment.end = firstStart;
    }
    this.dialogues.push(...notExistedDialogues);
  }

  private timer?: NodeJS.Timeout;

  private timeSegments?: StreamTimeSegments;

  private timeout: boolean = true;

  private currentTime?: number;

  private isRequesting: boolean = false;

  private get canRequestPayload() {
    return !this.loader.canPreload && !this.isRequesting && (
      (this.timeSegments && !this.timeSegments.check(this.currentTime || 0)) || this.timeout
    );
  }

  private lastDialoguesResult: ImageCue[] = [];

  private areEqualDialogues(
    newDialogues: (IInternalImageCue | ImageCue)[],
    oldDialogues: ImageCue[],
  ) {
    return newDialogues.length === oldDialogues.length && newDialogues
      .every(dialogue => oldDialogues
        .some(({ start, end }) => dialogue.start === start && dialogue.end === end));
  }

  public async getDialogues(time?: number): Promise<ImageCue[]> {
    if (this.loader.canPreload) {
      if (!this.loader.fullyRead) {
        this.payload = await this.loader.getPayload() as Buffer;
      }
    } else if (!this.loader.fullyRead) {
      if (!this.metadataString) this.metadataString = await this.loader.getMetadata();
      this.currentTime = time || 0;
      if (this.canRequestPayload) {
        if (this.timer) clearTimeout(this.timer);
        this.timeout = false;
        this.timer = setTimeout(() => { this.timeout = true; }, 10000);
        this.isRequesting = true;
        const payload = await this.loader.getPayload(time) as Buffer || Buffer.alloc(0);
        const newCues = this.parseDialogues(payload, 0);
        if (!this.timeSegments) this.timeSegments = new StreamTimeSegments();
        this.timeSegments.bulkInsert(newCues.map(({ start, end }) => [start, end]), time || 0);
        this.addDialogues(newCues);
        this.isRequesting = false;
      }
    }
    const matchedDialogues = this.dialogues
      .filter(({ start, end }) => start <= (time || 0) && end >= (time || 0));
    if (!this.areEqualDialogues(matchedDialogues, this.lastDialoguesResult)) {
      this.lastDialoguesResult = matchedDialogues.map((cue) => {
        const payloadPosition = (cue as IInternalImageCue).payloadPosition;
        if (payloadPosition) {
          return { ...cue, payload: this.payload.subarray(...payloadPosition) };
        }
        return (cue as ImageCue);
      });
    }
    return this.lastDialoguesResult;
  }
}
