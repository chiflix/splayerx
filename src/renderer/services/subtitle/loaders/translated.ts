import { cloneDeep } from 'lodash';
import uuidv4 from 'uuid/v4';
import { TranscriptInfo } from 'sagi-api/translation/v1/translation_pb';
import { LanguageCode, normalizeCode } from '@/libs/language';
import {
  IOrigin, IEntityGenerator, Type, Format,
} from '@/interfaces/ISubtitle';


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

  private translatedType: TranslatedGeneratorType;

  public constructor(transcriptInfo: TranscriptInfo.AsObject | null, languageCode?: LanguageCode) {
    this.translatedType = transcriptInfo ? TranslatedGeneratorType.Subtitle
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

  public async getDisplaySource() { return cloneDeep(this.origin); }

  public async getRealSource() { return cloneDeep(this.origin); }

  public async getLanguage() {
    return this.language;
  }

  public async getFormat() { return Format.Sagi; }

  public async getHash() {
    if (this.translatedType === TranslatedGeneratorType.Subtitle) {
      return this.origin.source;
    }
    return uuidv4();
  }

  public async getDelay() { return 0; }
}
