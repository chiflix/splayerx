import franc from 'franc';
import { isSimplified } from 'traditional-or-simplified';
import { normalizeCode } from '../language';

export default function fragmentToLanguage(fragment, type) {
  fragment = fragment.replace(/\r?\n|\r/g, '\n');
  const dialogueNomalizer = (fragment, textRegex) => {
    const texts = fragment.replace(textRegex, '');
    let textsWithIdentifier;
    const identifier = '\ns\n';
    if (type === 'ass') textsWithIdentifier = texts.replace(/\n/g, identifier);
    else textsWithIdentifier = texts.replace(/(?<=\S)\n{2,}(?=\S)/g, identifier);
    const dialogues = textsWithIdentifier.split(identifier);
    return dialogues.slice(2, dialogues.length - 2);
  };
  const dialoguesSplitter = (dialogues, splitterRegex) => {
    dialogues = dialogues.map(dialogue => dialogue.split(splitterRegex));

    const languageCount = dialogues
      .map(({ length }) => length)
      .some(length => length > 1) ? 2 : 1;

    const result = [];
    for (let i = 0; i < languageCount; i += 1) {
      const resultStr = dialogues.reduce((resultStr, currentDialogue) => {
        if (currentDialogue.length < languageCount) return resultStr;
        return resultStr.concat(currentDialogue[i]);
      }, '');
      result.push(resultStr);
    }
    return result.map(franc).map((iso6393code, index) => {
      if (iso6393code === 'cmn') {
        try {
          return isSimplified(result[index]) ? 'zh-CN' : 'zh-TW';
        } catch (e) {
          return 'zh-CN';
        }
      }
      return normalizeCode(iso6393code);
    });
  };
  let dialogues;
  let splitterRegex = /\n/g;
  switch (type.toLowerCase()) {
    default:
      break;
    case 'ass':
    case 'advanced substation alpha':
    case 'ssa':
    case 'substation alpha': {
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
    case 'srt':
    case 'subrip': {
      const textRegex = /\d+\n.*\n|<\/?\w>|{.*}/g;
      dialogues = dialogueNomalizer(fragment, textRegex);
      break;
    }
    case 'vtt':
    case 'webvtt': {
      const textRegex = /(\d+|[\d\s:.\->]{29})\n/g;
      dialogues = dialogueNomalizer(fragment, textRegex);
      break;
    }
  }
  return dialoguesSplitter(dialogues, splitterRegex);
}
