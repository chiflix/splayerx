import { LanguageCode, normalizeCode } from '@/libs/language';
import { Origin, EntityGenerator, Type, Format } from '@/interfaces/ISubtitle';
import { cloneDeep } from 'lodash';
import uuidv4 from 'uuid/v4';


interface TranslatedOrigin extends Origin {
  type: Type.Translated;
  source: string;
}
export class TranslatedGenerator implements EntityGenerator {
  private origin: TranslatedOrigin;
  private language: LanguageCode;
  readonly ranking: number;
  constructor(languageCode: LanguageCode, ranking: number) {
    this.origin = {
      type: Type.Translated,
      source: new Date().toUTCString(),
    };
    this.language = normalizeCode(languageCode);
    this.ranking = ranking;
  }

  async getType() { return Type.Translated; }

  async getSource() { return cloneDeep(this.origin); }
  async getLanguage() {
    return this.language;
  }
  async getFormat() { return Format.Unknown; }
  async getHash() { return uuidv4(); }

  async getPayload() {
    return '';
  }
}
