import camelCase from 'lodash/camelCase';
import { codeIndex } from '@/libs/language';

export function metaInfoToWeight(subtitleType, infoType, value, subtitleList, primaryLanguage) {
  const result = { existed: subtitleList.filter(({ rank }) => !!rank).length * (subtitleType === 'local' ? -1 : 1) };
  switch (infoType) {
    case 'language': {
      result.matchPrimaryLanguage = primaryLanguage === value ? 1 : 0;
      result.existedLanguage = subtitleList
        .filter(({ language: existedLanguage }) => existedLanguage === value).length;
      result.languageRanking = codeIndex(value);
      break;
    }
    case 'isDefault':
      result.matchDefault = value ? 1 : 0;
      break;
    case 'streamIndex':
      result.streamIndex = value || 0;
      break;
    case 'ranking':
      result.ranking = value || 0;
      break;
    default:
      break;
  }

  return result;
}

export function rankCalculation(type, options, lastRank) {
  const baseRanks = {
    custom: 1e16,
    local: 1e12,
    embedded: 1e8,
    online: 1e4,
  };
  const rankTypes = [
    {
      name: 'MATCH_PRIMARY_LANGUAGE',
      value: 1e4,
      types: ['online'],
    },
    {
      name: 'MATCH_DEFAULT',
      value: 1e3,
      types: ['embedded'],
    },
    {
      name: 'LANGUAGE_RANKING',
      value: -1e3,
      types: ['online'],
    },
    {
      name: 'EXISTED_LANGUAGE',
      value: -1e2,
      types: ['online'],
    },
    {
      name: 'STREAM_INDEX',
      value: -1e2,
      types: ['embedded'],
    },
    {
      name: 'RANKING',
      value: 1e1,
      types: ['online'],
    },
    {
      name: 'EXISTED',
      value: -1e0,
      types: ['custom', 'local', 'embedded', 'online'],
    },
  ];
  const baseRank = lastRank || baseRanks[type] || 0;
  return rankTypes
    .filter(({ name, types }) => options[camelCase(name)] && types.includes(type))
    .reduce((prev, { name, value }) => prev + (value * options[camelCase(name)]), baseRank);
}

export function metaInfoUpdate(
  subtitleType, subtitleList, primaryLanguage,
  infoType, infoValue,
  lastRank,
) {
  const weightOptions = metaInfoToWeight(
    subtitleType,
    infoType, infoValue,
    subtitleList, primaryLanguage,
  );
  if (lastRank) Reflect.deleteProperty(weightOptions, 'existed');
  return rankCalculation(subtitleType, weightOptions, lastRank);
}
