import { LanguageCode, normalizeCode } from '@/libs/language';
import { MediaTranslationResponse } from 'sagi-api/translation/v1/translation_pb';
import Sagi from '@/libs/sagi';
import { Origin, EntityGenerator, Type, Format } from '@/interfaces/ISubtitle';

interface OnlineOrigin extends Origin {
  type: Type.Online;
  source: string;
}
export class OnlineGenerator implements EntityGenerator {
  private origin: OnlineOrigin;
  private language: LanguageCode;
  readonly ranking: number;
  constructor(transcriptInfo: MediaTranslationResponse.TranscriptInfo.AsObject) {
    this.origin.source = transcriptInfo.transcriptIdentity;
    this.language = normalizeCode(transcriptInfo.languageCode);
    this.ranking = transcriptInfo.ranking;
  }

  async getType() { return Type.Online; }

  async getSource() { return this.origin; }
  async getLanguage() {
    return this.language;
  }
  async getFormat() { return Format.Sagi; }
  async getHash() { return this.origin.source; }

  async getPayload() {
    return Sagi.getTranscript({ transcriptIdentity: this.origin.source, startTime: 0 });
  }
}
