import { TranscriptResponse } from 'sagi-api/translation/v1/translation_pb';

export type SagiSubtitlePayload = TranscriptResponse.Cue.AsObject[];

export { AssParser } from './ass';
export { SagiParser } from './sagi';
export { SrtParser } from './srt';
export { VttParser } from './vtt';
