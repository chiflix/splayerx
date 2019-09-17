import sortVideoFile from '@/helpers/sort';

describe('helper sort', () => {
  it('set & get correct data', () => {
    const a = [
      '1.mp4',
      '10.mp4',
      '14.mp4',
      '19.mp4',
      '2.mp4',
      '3.mp4',
      '35.mp4',
      '4.mp4',
      '41.mp4',
      '57.mp4',
      '9.mp4',
      'a1.mp4',
      'a111.mp4',
      'a12.mp4',
      'a2.mp4',
      'abc.mp4',
      'bcdd123.mp4',
    ];
    const expected = [
      '1.mp4',
      '2.mp4',
      '3.mp4',
      '4.mp4',
      '9.mp4',
      '10.mp4',
      '14.mp4',
      '19.mp4',
      '35.mp4',
      '41.mp4',
      '57.mp4',
      'a1.mp4',
      'a2.mp4',
      'a12.mp4',
      'a111.mp4',
      'abc.mp4',
      'bcdd123.mp4',
    ];
    a.sort();
    a.sort(sortVideoFile);

    expect(a).deep.equal(expected);
  });
});
