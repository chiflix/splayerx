// @ts-ignore
import { toVttTime, stringifyVtt } from 'subtitle';
import { SagiSubtitlePayload } from '../parsers';

export function sagiSubtitleToWebVTT(subtitlePayload: SagiSubtitlePayload): string {
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
