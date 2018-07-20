import helpers from '@/helpers';

describe('timecodeFromSeconds method works fine', () => {
  it('should display correct time codes', () => {

      const expectedResult1 = '00:00';
      const functionResult1 = helpers.methods.timecodeFromSeconds(0);
      expect(functionResult1).to.be.equal(expectedResult1);

      const expectedResult2 = '00:01';
      const functionResult2 = helpers.methods.timecodeFromSeconds(1);
      expect(functionResult2).to.be.equal(expectedResult2);

      const expectedResult3 = '00:10';
      const functionResult3 = helpers.methods.timecodeFromSeconds(10);
      expect(functionResult3).to.be.equal(expectedResult3);

      const expectedResult4 = '01:00';
      const functionResult4 = helpers.methods.timecodeFromSeconds(60);
      expect(functionResult4).to.be.equal(expectedResult4);

      const expectedResult5 = '01:01';
      const functionResult5 = helpers.methods.timecodeFromSeconds(61);
      expect(functionResult5).to.be.equal(expectedResult5);

      const expectedResult6 = '10:01';
      const functionResult6 = helpers.methods.timecodeFromSeconds(601);
      expect(functionResult6).to.be.equal(expectedResult6);

      const expectedResult7 = '1:01:01';
      const functionResult7 = helpers.methods.timecodeFromSeconds(3661);
      expect(functionResult7).to.be.equal(expectedResult7);

      const expectedResult8 = '11:11:11';
      const functionResult8 = helpers.methods.timecodeFromSeconds(40271);
      expect(functionResult8).to.be.equal(expectedResult8);

  });

  


});
