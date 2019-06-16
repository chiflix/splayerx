import { IDialogueTag } from './parsers';

/**
 * Cue tags getter for SubRip, SubStation Alpha and Online Transcript subtitles.
 *
 * @export
 * @param {string} text - cue text to evaluate.
 * @param {object} baseTags - default tags for the cue.
 * @returns {object} tags object for the cue
 */
export function tagsGetter(text: string, baseTags: IDialogueTag) {
  const tagRegex = /\{[^{}]*\}/g;
  const matchTags = text.match(tagRegex);
  const finalTags = { ...baseTags };
  if (matchTags) {
    const tagGetters = {
      an: (tag: string) => {
        const matchedAligment = tag.match(/\d/g);
        if (matchedAligment) return Number.parseFloat(matchedAligment[0])
      },
      pos: (tag: string) => {
        const matchedCoords = tag.match(/\((.*)\)/);
        if (matchedCoords) {
          const coords = matchedCoords[1].split(',');
          return ({
            pos: {
              x: Number.parseFloat(coords[0]),
              y: Number.parseFloat(coords[1]),
            },
          });
        }
      },
    };
    for (let tag of matchTags) {
      tag = tag.replace(/[{}\\/]/g, '');
      Object.keys(tagGetters).forEach((getterType) => {
        if (tag.startsWith(getterType)) {
          Object.assign(finalTags, tagGetters[getterType](tag));
        }
      });
    }
  }
  return finalTags;
}