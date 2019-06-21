import JsonStorage from '../../../../src/renderer/libs/JsonStorage';

describe('JsonStorage libs', () => {
  const jsonStorage = new JsonStorage();

  beforeEach(async () => {
    await jsonStorage.clear();
  });

  it('should successfully set demo', async () => {
    const demo = {
      testNUmber: 1,
      testString: '1',
    };
    let r = false;
    try {
      r = await jsonStorage.set('test', demo);
    } catch (error) {
      r = false;
    }
    expect(r).to.be.equal(true);
  });

  it('should successfully get demo', async () => {
    const demo = {
      testNUmber: 1,
      testString: '1',
    };
    let r = {};
    try {
      await jsonStorage.set('test', demo);
      r = await jsonStorage.get('test');
    } catch (error) {
      r = {};
    }
    expect(r.testNUmber).to.be.equal(1);
    expect(r.testString).to.be.equal('1');
  });

  it('should successfully clear', async () => {
    const demo = {
      testNUmber: 1,
      testString: '1',
    };
    let r = {};
    try {
      await jsonStorage.set('test', demo);
      r = await jsonStorage.get('test');
    } catch (error) {
      r = {};
    }
    expect(r.testNUmber).to.be.equal(1);
    expect(r.testString).to.be.equal('1');
    try {
      await jsonStorage.clear();
      r = await jsonStorage.get('test');
    } catch (error) {
      r = null;
    }
    expect(r.testNUmber).to.be.equal(undefined);
    expect(r.testString).to.be.equal(undefined);
  });
});
