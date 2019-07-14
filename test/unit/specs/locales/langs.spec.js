import {
  fromPairs, mapValues, difference,
} from 'lodash';

const files = require.context('@/locales/lang/', false, /\.json$/);

const langs = fromPairs(files.keys().map(file => [file.match(/[^/]+(?=\.json$)/)[0], files(file)]));
const objectDeepKeys = obj => Object.keys(obj).filter(key => obj[key] instanceof Object)
  .map(key => objectDeepKeys(obj[key]).map(k => `${key}.${k}`))
  .reduce((x, y) => x.concat(y), Object.keys(obj));
const langKeys = mapValues(langs, objectDeepKeys);

describe('locales - langs', () => {
  it('should have several mainstream locales', () => {
    expect(langs).to.include.all.keys('en', 'zh-Hans', 'zh-Hant', 'ja');
  });
  it('should have limited key differences between en and in other locales', () => {
    const enKeys = langKeys.en;
    Object.keys(langKeys).forEach((locale) => {
      expect(difference(langKeys[locale], enKeys)).to.have.lengthOf.at.most(enKeys.length / 2);
    });
  });
});
