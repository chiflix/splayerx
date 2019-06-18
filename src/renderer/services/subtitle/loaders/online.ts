import { IOriginSubtitle, SubtitleType } from './index';
import { LanguageCode, normalizeCode } from '@/libs/language';
import { MediaTranslationResponse } from 'sagi-api/translation/v1/translation_pb';
import { SubtitleFormat, SagiSubtitle } from '../parsers';
import Sagi from '@/libs/sagi';

export class OnlineSubtitle implements IOriginSubtitle {
  origin: string;
  private language: LanguageCode;
  ranking: number;
  constructor(transcriptInfo: MediaTranslationResponse.TranscriptInfo.AsObject) {
    this.origin = transcriptInfo.transcriptIdentity;
    this.language = normalizeCode(transcriptInfo.languageCode);
    this.ranking = transcriptInfo.ranking;
  }

  format: SubtitleFormat.Sagi;
  type: SubtitleType.Online;

  async computeLang() {
    return this.language;
  }

  async load() {
    const payload = await Sagi.getTranscript({ transcriptIdentity: this.origin, startTime: 0 });
    return new SagiSubtitle(payload);
  }
}
