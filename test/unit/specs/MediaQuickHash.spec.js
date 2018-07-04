import helpers from '@/helpers';

describe('MediaQuickHash test: ', function () {
  it('should return correct hash value', function () {
    const expectedResult = '84f0e9e5e05f04b58f53e2617cc9c866-'
                        + 'f54d6eb31bef84839c3ce4fc2f57991c-'
                        + 'b1f0696aec64577228d93eabcc8eb69b-'
                        + 'f497c6684c4c6e50d0856b5328a4bedc';
    const functionResult = helpers.methods.mediaQuickHash('../../../test/assets/mediaQuickHash_test.avi');
    expect(functionResult).to.be.equal(expectedResult);
  });
});
