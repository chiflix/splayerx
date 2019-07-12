import { LanguageCode, normalizeCode } from '@/libs/language';
import { Origin, EntityGenerator, Type, Format } from '@/interfaces/ISubtitle';
import Sagi from '@/libs/sagi';
import { cloneDeep } from 'lodash';
import uuidv4 from 'uuid/v4';
import { TranscriptInfo } from 'sagi-api/translation/v1/translation_pb';


interface TranslatedOrigin extends Origin {
  type: Type.Translated;
  source: string;
}
// TranslatedGenerator种类
enum TranslatedGeneratorType {
  Subtitle = 'subtitle', // AI字幕
  Button = 'button', // AI按钮
}
export class TranslatedGenerator implements EntityGenerator {
  private origin: TranslatedOrigin;
  private language: LanguageCode;
  readonly ranking: number;
  private tranlsatedType: TranslatedGeneratorType;

  constructor(transcriptInfo: TranscriptInfo.AsObject | null, languageCode?: LanguageCode) {
    this.tranlsatedType = transcriptInfo ? TranslatedGeneratorType.Subtitle : TranslatedGeneratorType.Button;
    this.origin = {
      type: Type.Translated,
      source: transcriptInfo ? transcriptInfo.transcriptIdentity : '',
    };
    this.language = transcriptInfo ? normalizeCode(transcriptInfo.languageCode) : languageCode ? normalizeCode(languageCode) : LanguageCode.Default;
    this.ranking = transcriptInfo ? transcriptInfo.ranking : 0;
  }
  async getType() { return Type.Translated; }

  async getSource() { return cloneDeep(this.origin); }
  async getLanguage() {
    return this.language;
  }
  async getFormat() { return this.tranlsatedType === TranslatedGeneratorType.Subtitle ? Format.Sagi : Format.Unknown; }
  async getHash() { return uuidv4(); }

  async getPayload() {
    return this.tranlsatedType === TranslatedGeneratorType.Subtitle ?
      Sagi.getTranscript({ transcriptIdentity: this.origin.source, startTime: 0 }) : '';
  }
}
