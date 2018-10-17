import helpers from '@/helpers';

describe('index.js', () => {
  describe('timecodeFromSeconds method works fine', () => {
    it('should display correct time codes', () => {
      const expectArray = ['00:00', '00:01', '00:10', '01:00', '01:01', '10:01',
        '1:01:01', '11:11:11'];

      const functionArray = [0, 1, 10, 60, 61, 601, 3661, 40271];
      let i;
      let expectedResult;
      let functionResult;

      for (i = 0; i < expectArray.length; i += 1) {
        expectedResult = expectArray[i];
        functionResult = helpers.methods.timecodeFromSeconds(functionArray[i]);
        expect(functionResult).to.be.equal(expectedResult);
      }
    });
  });
});
