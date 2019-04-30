const files = require.context('@/locales/lang/', false, /\.json$/);
const langs = files.keys().map(file => files(file));

describe('locales - langs', () => {
  it('should all langs have exact same keys', () => {
    const extractKeys = obj => (obj ? Object.keys(obj)
      .reduce((keysObj, currentKey) => {
        const currentVal = obj[currentKey];
        if (typeof currentVal === 'object') {
          if (currentVal instanceof Array) {
            keysObj[currentKey] = currentVal.map((val) => {
              if (typeof val === 'object') return extractKeys(val);
              return '';
            });
          } else keysObj[currentKey] = extractKeys(currentVal);
        } else keysObj[currentKey] = '';
        return keysObj;
      }, {}) : '');
    const firstKeys = extractKeys(langs[0]);
    langs.slice(1).forEach((lang) => {
      expect(firstKeys).to.deep.equal(extractKeys(lang));
    });
  });
});
