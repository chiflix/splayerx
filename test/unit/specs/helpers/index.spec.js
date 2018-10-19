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
  // describe.only('findSimilarVideoByVidPath', () => {
  //   // function flatten(group) {
  //   //   const result = [];
  //   //   for (let i = 0; i < Object.keys(group).length; i += 1) {
  //   //   }
  //   //   return result;
  //   // }
  //   function tryGroup(names) {
  //     const number = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  //     const chineseNumber = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  //     let prefix = '';
  //     let group = {};
  //     let currChar = [];
  //     for (let i = 0; Object.keys(group).length < 2; i = prefix.length) {
  //       let lastPrefix = '';
  //       for (let j = 0; j < names.length; j += 1) {
  //         const name = names[j];
  //         const c = name[i];
  //         const p = prefix + c;
  //         lastPrefix = p;
  //         if (!Object.keys(group).includes(p)) {
  //           group[p] = [];
  //           currChar.push(c);
  //         }
  //         group[p].push(name);
  //       }
  //       if (Object.keys(group).length === 1) {
  //         prefix = lastPrefix;
  //         group = {};
  //         currChar = [];
  //       }
  //     }
  //     let maxSubGroupCount = 0;
  //     Object.values(group).forEach((value) => {
  //       if (value.length > maxSubGroupCount) {
  //         maxSubGroupCount = value.length;
  //       }
  //     });
  //     for (let i = 0; i < currChar.length; i += 1) {
  //       if (number.includes(currChar[i]) || chineseNumber.includes(currChar[i])) {
  //         // console.log('it is number');
  //         // sort
  //         // group[p] = sort(group[p]);
  //       }
  //     }
  //     if (maxSubGroupCount > 2) {
  //       for (let i = 0; i < Object.keys(group).length; i += 1) {
  //         const subNames = group[Object.keys(group)[i]];
  //         const subResult = tryGroup(subNames);
  //         console.log(i, subResult);
  //       }
  //     }
  //     console.log('result:', group);
  //     // flatten(group);
  //     return group;
  //   }

  //   // function sort(names) {
  //   //   for (let i = 0; i < names.length; i += 1) {
  //   //     const name = names[i];
  //   //   }
  //   // }

  //   it('work fine', () => {
  //     const names = [
  //       'abcdefgS0119',
  //       'abcdefgS0118',
  //       'abcdefgS0201',
  //       'abcdefgS0121',
  //       'abcdefgS0120',
  //       'abcdefgS0122',
  //     ];
  //     const result = tryGroup(names);
  //     // const result = sort(names);
  //     expect(result).equal('');
  //   });
  // });
});
