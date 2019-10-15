import franc from 'franc';
// @ts-ignore
import { isSimplified } from 'traditional-or-simplified';
import { normalizeCode, LanguageCode } from '@/libs/language';

function dialogueTextToDialogues(dialogueText: string, textRegex: RegExp, identifierLocation: RegExp = /(?<=\S)\n{2,}(?=\S)/g) {
  const texts = dialogueText.replace(textRegex, '');
  const identifier = '\ns\n';
  const textsWithIdentifier = texts.replace(identifierLocation, identifier);
  const dialogues = textsWithIdentifier.split(identifier);
  return dialogues.slice(2, dialogues.length - 2);
}

function dialoguesToLanguageCodes(dialogues: string[], splitterRegex: RegExp = /\n/g): LanguageCode[] {
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
        return isSimplified(result[index]) ? LanguageCode['zh-CN'] : LanguageCode['zh-TW'];
      } catch (e) {
        return LanguageCode['zh-CN'];
      }
    }
    return normalizeCode(iso6393code);
  });
}

export function assFragmentLanguageLoader(fragment: string): LanguageCode[] {
  // extract dialogue text from text fragment
  const dialogueMatchRegex = /^Dialogue.*/gm;
  let matched = dialogueMatchRegex.exec(fragment);
  let dialogueText = '';
  while (matched) {
    dialogueText += `\n${matched[0]}`;
    matched = dialogueMatchRegex.exec(fragment);
  }
  // no dialogue text extracted
  if (!dialogueText) return [LanguageCode.No];

  // convert dialogue text to dialogues
  const textRegex = /[^{}\n]*,|\{.+\}|[mlb][\s\d-]*/g;
  const identifierLocation = /\n/g;
  const dialogues = dialogueTextToDialogues(dialogueText, textRegex, identifierLocation);

  // extract language codes from dialogues
  const splitterRegex = /\\+n\s?/gi;
  return dialoguesToLanguageCodes(dialogues, splitterRegex);
}
export function srtFragmentLanguageLoader(fragment: string): LanguageCode[] {
  const textRegex = /\d+\n.*\n|<\/?\w>|{.*}/g;
  const dialogues = dialogueTextToDialogues(fragment, textRegex);

  return dialoguesToLanguageCodes(dialogues);
}
export function vttFragmentLanguageLoader(fragment: string): LanguageCode[] {
  const textRegex = /(\d+|[\d\s:.\->]{29})\n/g;
  const dialogues = dialogueTextToDialogues(fragment, textRegex);

  return dialoguesToLanguageCodes(dialogues);
}
