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

    const firstDialogueLanguageCount = dialogues[0].length;
    const secondDialogueLanguageCount = dialogues[1].length;
    const languageCount = Math.max(firstDialogueLanguageCount, secondDialogueLanguageCount);

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
        return isSimplified(result[index]) ? 'zh-CN' : 'zh-TW';
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
      const textRegex = /(Dialogue([:,.*\w\d\s]+))|(\{.+\})/g;
      dialogues = dialogueNomalizer(fragment, textRegex);
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
