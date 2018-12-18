import syncStorage from '@/helpers/syncStorage';

describe('helper syncStorage', () => {
  const randomValue = Math.floor(Math.random() * 10000);
  it('get & set correct data', () => {
    syncStorage.setSync('foo', { value: randomValue });
    expect(syncStorage.getSync('foo')).deep.equal({ value: randomValue });
  });
  it('if the file not exist then return empty object', () => {
    const data = syncStorage.getSync('bar');
    expect(data).deep.equal({});
  });
});
