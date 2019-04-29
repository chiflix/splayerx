// import infoDB from '@/helpers/infoDB';

// describe('helper infoDB', () => {
//   const quickHash1 = '11-22-33-44';
//   const quickHash2 = '22-33-44-55';
//   const quickHash3 = '33-44-55-66';
//   it('add method', async () => {
//     const value = { quickHash: quickHash1 };
//     await infoDB.add('recent-played', value);

//     const result = await infoDB.get('recent-played', quickHash1);
//     expect(result).deep.equal(value);
//   });
//   it('get method', async () => {
//     const path = '/Users';
//     const value = { quickHash: quickHash1, path };
//     await infoDB.add('recent-played', value);

//     const result = await infoDB.get('recent-played', 'path', path);
//     expect(result).deep.equal(value);
//   });
//   it('getAll method', async () => {
//     const value1 = { quickHash: quickHash1 };
//     const value2 = { quickHash: quickHash2 };
//     await infoDB.add('recent-played', value1);
//     await infoDB.add('recent-played', value2);

//     const result = await infoDB.getAll('recent-played');
//     expect(result).deep.equal([value1, value2]);
//   });
//   it('delete method', async () => {
//     const value = { quickHash: quickHash1 };
//     await infoDB.add('recent-played', value);
//     let result = await infoDB.get('recent-played', quickHash1);
//     expect(result).deep.equal(value);
//     await infoDB.delete('recent-played', quickHash1);
//     result = await infoDB.get('recent-played', quickHash1);
//     expect(result).deep.equal(undefined);
//   });
//   it('lastPlayed method', async () => {
//     const value = [
//       { quickHash: quickHash1, lastOpened: 1 },
//       { quickHash: quickHash2, lastOpened: 2 },
//       { quickHash: quickHash3, lastOpened: 3 },
//     ];
//     const missonArray = [];
//     value.forEach((data) => {
//       missonArray.push(infoDB.add('recent-played', data));
//     });
//     await Promise.all(missonArray);
//     const result = await infoDB.lastPlayed();
//     expect(result).deep.equal(value[2]);
//   });
//   it('sortedResult method', async () => {
//     const value = [
//       { quickHash: quickHash1, lastOpened: 17 },
//       { quickHash: quickHash2, lastOpened: 2 },
//       { quickHash: quickHash3, lastOpened: 3 },
//     ];
//     const missonArray = [];
//     value.forEach((data) => {
//       missonArray.push(infoDB.add('recent-played', data));
//     });
//     await Promise.all(missonArray);
//     const result = await infoDB.sortedResult('recent-played', 'lastOpened', 'prev');
//     expect(result).deep.equal([value[0], value[2], value[1]]);
//   });
//   it('cleanData method', async () => {
//     const value = Array(15);
//     const missonArray = [];
//     for (let i = 0; i < value.length; i += 1) {
//       value[i] = {
//         quickHash: quickHash1 + i,
//         shortCut: `shortCut${i}`,
//         lastOpened: i,
//       };
//       missonArray.push(infoDB.add('recent-played', value[i]));
//     }
//     await Promise.all(missonArray);
//     await infoDB.cleanData();
//     const result = await infoDB.sortedResult('recent-played', 'lastOpened', 'prev');
//     for (let i = 11; i < result.length; i += 1) {
//       expect(Object.prototype.hasOwnProperty.call(result[i], 'shortCut')).equal(false);
//     }
//   });
// });
