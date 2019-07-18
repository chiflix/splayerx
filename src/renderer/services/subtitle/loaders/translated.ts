import { cloneDeep } from 'lodash';
import uuidv4 from 'uuid/v4';
import { TranscriptInfo } from 'sagi-api/translation/v1/translation_pb';
import { LanguageCode, normalizeCode } from '@/libs/language';
import {
  IOrigin, IEntityGenerator, Type, Format,
} from '@/interfaces/ISubtitle';
import Sagi from '@/libs/sagi';


interface ITranslatedOrigin extends IOrigin {
  type: Type.Translated;
  source: string;
}
// TranslatedGenerator种类
enum TranslatedGeneratorType {
  Subtitle = 'subtitle', // AI字幕
  Button = 'button', // AI按钮
}
export class TranslatedGenerator implements IEntityGenerator {
  private origin: ITranslatedOrigin;

  private language: LanguageCode;

  public readonly ranking: number;

  private tranlsatedType: TranslatedGeneratorType;

  public constructor(transcriptInfo: TranscriptInfo.AsObject | null, languageCode?: LanguageCode) {
    this.tranlsatedType = transcriptInfo ? TranslatedGeneratorType.Subtitle
      : TranslatedGeneratorType.Button;
    this.origin = {
      type: Type.Translated,
      source: transcriptInfo ? transcriptInfo.transcriptIdentity : '',
    };
    if (transcriptInfo) {
      this.language = normalizeCode(transcriptInfo.languageCode);
    } else if (languageCode) {
      this.language = normalizeCode(languageCode);
    } else {
      this.language = LanguageCode.Default;
    }
    this.ranking = transcriptInfo ? transcriptInfo.ranking : 0;
  }

  public async getType() { return Type.Translated; }

  public async getSource() { return cloneDeep(this.origin); }

  public async getLanguage() {
    return this.language;
  }

  public async getFormat() {
    return this.tranlsatedType === TranslatedGeneratorType.Subtitle ? Format.Sagi : Format.Unknown;
  }

  public async getHash() { return uuidv4(); }

  public async getPayload() {
    return this.tranlsatedType === TranslatedGeneratorType.Subtitle
      ? Sagi.getTranscript({ transcriptIdentity: this.origin.source, startTime: 0 }) : '';
  }
}
