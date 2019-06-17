import { IOriginSubtitle, SubtitleType } from './index';
import { LanguageCode, normalizeCode, LanguageName } from '@/libs/language';
import { MediaTranslationResponse } from 'sagi-api/translation/v1/translation_pb';
import { SubtitleFormat, SagiSubtitle } from '../parsers';
import romanize from 'romanize';
import Sagi from '@/helpers/sagi';

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

  private computeSubtitleIndex(subtitleList: OnlineSubtitle[]) {
    if (!subtitleList.includes(this)) return subtitleList.length;
    return subtitleList
      .filter(({ language }) => language === this.language)
      .findIndex(subtitle => subtitle === this)
      + 1;
  }
  async computeName(subtitleList: OnlineSubtitle[], locale: LanguageCode) {
    const localeLanguagePrefix = LanguageName[locale];
    const subtitleIndex = this.computeSubtitleIndex(subtitleList);
    return `${localeLanguagePrefix} ${romanize(subtitleIndex)}`;
  }

  async load() {
    const payload = await Sagi.getTranscript({ transcriptIdentity: this.origin });
    return new SagiSubtitle(payload);
  }
}
