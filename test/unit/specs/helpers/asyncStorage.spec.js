import asyncStorage from '@/helpers/asyncStorage';

describe('helper asyncStorage', () => {
  const randomValue = Math.floor(Math.random() * 10000);
  it('set & get correct data', (done) => {
    asyncStorage.set('foo', { value: randomValue })
      .then(() => asyncStorage.get('foo'))
      .then((data) => {
        expect(data).deep.equal({ value: randomValue });
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});
