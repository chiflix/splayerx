import sortVideoFile from '@/helpers/sort';

describe('helper sort', () => {
  it('set & get correct data', () => {
    const a = ['1', '30', '4', '21', '100000'];
    a.sort();
    a.sort(sortVideoFile);

    expect(a).deep.equal(['1', '4', '21', '30', '100000']);
  });
});
