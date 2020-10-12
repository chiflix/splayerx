import { TranscriptInfo } from 'sagi-api/translation/v1/translation_pb';
import { cloneDeep } from 'lodash';
import { LanguageCode, normalizeCode } from '@/libs/language';
import {
  IOrigin, IEntityGenerator, Type, Format,
} from '@/interfaces/ISubtitle';

interface ITranslatedOrigin extends IOrigin {
  type: Type.Translated,
  source: string,
}
export class TranslatedGenerator implements IEntityGenerator {
  private origin: ITranslatedOrigin;

  private language: LanguageCode;

  public readonly ranking: number;

  private delayInSeconds: number;

  public constructor(transcriptInfo: TranscriptInfo.AsObject) {
    this.origin = {
      type: Type.Translated,
      source: transcriptInfo.transcriptIdentity,
    };
    this.language = normalizeCode(transcriptInfo.languageCode);
    this.ranking = transcriptInfo.ranking;
    this.delayInSeconds = transcriptInfo.delay / 1000;
  }

  public async getDisplaySource() { return cloneDeep(this.origin); }

  public async getRealSource() { return cloneDeep(this.origin); }

  public async getLanguage() {
    return this.language;
  }

  public async getDelay() { return this.delayInSeconds; }

  private format = Format.SagiText;

  public async getFormat() { return this.format; }

  public async getHash() { return this.origin.source; }
}
