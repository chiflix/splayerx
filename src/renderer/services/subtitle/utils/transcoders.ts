// @ts-ignore
import {
  toVttTime, toSrtTime, stringifyVtt, stringify,
  // @ts-ignore
} from '@splayer/subtitle';
import { SagiTextSubtitlePayload } from '../parsers';
import { TextCue } from '@/interfaces/ISubtitle';

export function sagiSubtitleToWebVTT(subtitlePayload: SagiTextSubtitlePayload): string {
  const vttSubtitles = subtitlePayload
    .map(cue => ({
      start: toVttTime(cue.startTime * 1000),
      end: toVttTime(cue.endTime * 1000),
      text: cue.text
        .replace(/(\\h)/g, ' ')
        .replace(/(\\N)/g, '<br/>'),
    }));
  // use stringifyVtt to turn sagi into string
  return stringifyVtt(vttSubtitles);
}

export function sagiSubtitleToSRT(subtitlePayload: TextCue[]): string {
  const srtSubtitles = subtitlePayload
    .map(cue => ({
      start: toSrtTime(cue.start * 1000),
      end: toSrtTime(cue.end * 1000),
      text: cue.text
        .replace(/(\\h)/g, ' ')
        .replace(/(\\N)/g, '<br/>'),
    }));
  // use stringifyVtt to turn sagi into string
  return stringify(srtSubtitles);
}
