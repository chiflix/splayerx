import franc from 'franc';
import { isSimplified } from 'traditional-or-simplified';
import { normalizeCode, LanguageCode } from '@/libs/language';
import { SubtitleFormat } from './parsers';

export default function fragmentToLanguageCode(fragment: string, format: SubtitleFormat): LanguageCode[] {
  fragment = fragment.replace(/\r?\n|\r/g, '\n');
  const dialogueNomalizer = (fragment: string, textRegex: RegExp) => {
    const texts = fragment.replace(textRegex, '');
    let textsWithIdentifier;
    const identifier = '\ns\n';
    if (format === SubtitleFormat.AdvancedSubStationAplha) textsWithIdentifier = texts.replace(/\n/g, identifier);
    else textsWithIdentifier = texts.replace(/(?<=\S)\n{2,}(?=\S)/g, identifier);
    const dialogues = textsWithIdentifier.split(identifier);
    return dialogues.slice(2, dialogues.length - 2);
  };
  const dialoguesSplitter = (dialogues: string[], splitterRegex:RegExp) => {
    const splittedDialogues = dialogues.map(dialogue => dialogue.split(splitterRegex));

    const languageCount = splittedDialogues
      .map(({ length }) => length)
      .some(length => length > 1) ? 2 : 1;

    const result: string[] = [];
    for (let i = 0; i < languageCount; i += 1) {
      const resultStr = dialogues.reduce((resultStr, currentDialogue) => {
        if (currentDialogue.length < languageCount) return resultStr;
        return resultStr.concat(currentDialogue[i]);
      }, '');
      result.push(resultStr);
    }
    return result.map(str => franc(str)).map((iso6393code, index) => {
      if (iso6393code === 'cmn') {
        try {
          return isSimplified(result[index]) ? LanguageCode.简体中文 : LanguageCode.繁體中文;
        } catch (e) {
          return LanguageCode.简体中文;
        }
      }
      return normalizeCode(iso6393code);
    });
  };
  let dialogues: string[] = [];
  let splitterRegex = /\n/g;
  switch (format.toLowerCase()) {
    default:
      break;
    case SubtitleFormat.AdvancedSubStationAplha:
    case SubtitleFormat.SubStationAlpha: {
      const dialogueMatchRegex = /^Dialogue.*/gm;
      let matched = dialogueMatchRegex.exec(fragment);
      let resultFragment = '';
      while (matched) {
        resultFragment = `${resultFragment}\n${matched[0]}`;
        matched = dialogueMatchRegex.exec(fragment);
      }
      const textRegex = /[^{}\n]*,|\{.+\}|[mlb][\s\d-]*/g;
      dialogues = dialogueNomalizer(resultFragment, textRegex);
      splitterRegex = /\\+n\s?/gi;
      break;
    }
    case SubtitleFormat.SubRip: {
      const textRegex = /\d+\n.*\n|<\/?\w>|{.*}/g;
      dialogues = dialogueNomalizer(fragment, textRegex);
      break;
    }
    case SubtitleFormat.WebVTT: {
      const textRegex = /(\d+|[\d\s:.\->]{29})\n/g;
      dialogues = dialogueNomalizer(fragment, textRegex);
      break;
    }
  }
  return dialoguesSplitter(dialogues, splitterRegex);
}
