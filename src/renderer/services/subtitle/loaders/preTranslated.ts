import { cloneDeep } from 'lodash';
import uuidv4 from 'uuid/v4';
import { TranscriptInfo } from 'sagi-api/translation/v1/translation_pb';
import { LanguageCode, normalizeCode } from '@/libs/language';
import {
  IOrigin, IEntityGenerator, Type, Format,
} from '@/interfaces/ISubtitle';


interface ITranslatedOrigin extends IOrigin {
  type: Type.PreTranslated,
  source: string,
}
// TranslatedGenerator种类
enum PreTranslatedGeneratorType {
  Subtitle = 'subtitle', // AI字幕
  Button = 'button', // AI按钮
}
export class PreTranslatedGenerator implements IEntityGenerator {
  private origin: ITranslatedOrigin;

  private language: LanguageCode;

  public readonly ranking: number;

  private translatedType: PreTranslatedGeneratorType;

  public constructor(transcriptInfo: TranscriptInfo.AsObject | null, languageCode?: LanguageCode) {
    this.translatedType = transcriptInfo ? PreTranslatedGeneratorType.Subtitle
      : PreTranslatedGeneratorType.Button;
    this.origin = {
      type: Type.PreTranslated,
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

  public async getFormat() { return Format.SagiText; }

  public async getHash() {
    if (this.translatedType === PreTranslatedGeneratorType.Subtitle) {
      return this.origin.source;
    }
    return uuidv4();
  }

  public async getDelay() { return 0; }
}
