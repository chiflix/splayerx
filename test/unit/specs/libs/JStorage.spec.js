import JStorage from '../../../../src/renderer/libs/JStorage';

describe('JStorage libs', () => {
  const jStorage = new JStorage();

  beforeEach(async () => {
    await jStorage.clear();
  });

  it('should successfully set demo', async () => {
    const demo = {
      testNUmber: 1,
      testString: '1',
    };
    let r = false;
    try {
      r = await jStorage.set('test', demo);
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
      await jStorage.set('test', demo);
      r = await jStorage.get('test');
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
      await jStorage.set('test', demo);
      r = await jStorage.get('test');
    } catch (error) {
      r = {};
    }
    expect(r.testNUmber).to.be.equal(1);
    expect(r.testString).to.be.equal('1');
    try {
      await jStorage.clear();
      r = await jStorage.get('test');
    } catch (error) {
      r = null;
    }
    expect(r.testNUmber).to.be.equal(undefined);
    expect(r.testString).to.be.equal(undefined);
  });
});

