import { createSandbox } from 'sinon';
import { flatten } from 'lodash';
import dataDb, { DataDb, __RewireAPI__ as dataDbRewireAPI } from '@/helpers/dataDb';
import { DOMStringListStub, randStr } from '../../helpers';

describe('class DataDb unit tests', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('method - getDb unit tests', () => {
    const randStr = () => Math.random().toString(36).substring(7);
    const testObjectStore = {
      name: 'testObjectStore',
      options: {},
      indexes: [
        { name: '2' },
        { name: randStr() },
      ],
    };
    const generateDatabase = (version) => {
      const schema = [];
      for (let i = 0; i < 1; i += 1) {
        schema.push({
          name: randStr(),
          options: { autoIncrement: true },
          indexes: [
            {
              name: randStr(),
              options: { unique: true },
            },
            {
              name: randStr(),
              keyPath: randStr(),
            },
          ],
        });
      }
      schema.push(testObjectStore);

      return { version, schema };
    };
    let version;
    let schema;
    const { getDb } = DataDb;

    let openDbStub;
    let createIndexStub;
    let deleteIndexStub;
    let createObjectStoreStub;
    let objectStoreStub;
    beforeEach(() => {
      ({ version, schema } = generateDatabase(1));
      createIndexStub = sandbox.stub();
      deleteIndexStub = sandbox.stub();
      createObjectStoreStub = sandbox.stub().returns({
        createIndex: createIndexStub,
      });
      objectStoreStub = () => ({
        indexNames: new DOMStringListStub(['1', '2']),
        createIndex: createIndexStub,
        deleteIndex: deleteIndexStub,
      });
      openDbStub = (dbName, version, { upgrade }) => {
        upgrade({
          objectStoreNames: new DOMStringListStub(['testObjectStore']),
          createObjectStore: createObjectStoreStub,
          transaction: { objectStore: objectStoreStub },
        });
      };
      dataDbRewireAPI.__Rewire__('openDB', openDbStub);
    });
    describe('getDb schema unit tests', () => {
      it('should getDb create objectStore when not exist', (done) => {
        getDb(version, schema)
          .then(() => {
            sandbox.assert.calledWith(
              createObjectStoreStub,
              schema[0].name,
            );
            done();
          }).catch(done);
      });
      it('should createIndex with the proper options', (done) => {
        const validSchema = schema.slice(0, schema.length - 2); // remove testObjectStore
        const indexes = flatten(validSchema.map(({ indexes }) => indexes));
        getDb(version, schema)
          .then(() => {
            indexes.forEach(({ name, keyPath, options }) => {
              sandbox.assert.calledWith(
                createIndexStub,
                name,
                keyPath || name,
                options,
              );
            });
            done();
          }).catch(done);
      });
      it('should update with proper indexes when objectStore exists', (done) => {
        getDb(version, schema)
          .then(() => {
            sandbox.assert.calledWith(
              deleteIndexStub,
              '1',
            );
            sandbox.assert.calledWith(
              createIndexStub,
              testObjectStore.indexes[1].name,
            );
            done();
          }).catch(done);
      });
    });
  });
  describe('method - getOwnDb unit tests', () => {
    let getDbStub;
    let testDataDb;

    beforeEach(() => {
      getDbStub = sandbox.stub(DataDb, 'getDb').resolves({});
      testDataDb = new DataDb();
    });

    it('should return invoke getDb when empty', (done) => {
      testDataDb.getOwnDb()
        .then(() => {
          sandbox.assert.called(getDbStub);
          done();
        }).catch(done);
    });

    it('should not invoke getDb when not empty', (done) => {
      testDataDb.getOwnDb()
        .then(() => testDataDb.getOwnDb())
        .then(() => {
          sandbox.assert.calledOnce(getDbStub);
          done();
        }).catch(done);
    });
  });
  describe('method - get unit tests', () => {
    const testObjectStoreName = 'testObjectStore';
    const testIndex = 'testIndex';
    const testVal = 'testVal';
    let getStub;
    let indexStub;
    let objectStoreStub;
    let transactionStub;
    beforeEach(() => {
      getStub = sandbox.stub();
      indexStub = sandbox.stub().returns({ get: getStub });
      objectStoreStub = sandbox.stub().returns({ get: getStub, index: indexStub });
      transactionStub = sandbox.stub().returns({ objectStore: objectStoreStub });
      sandbox.stub(dataDb, 'getOwnDb').returns({ transaction: transactionStub });
    });

    it('should invoke properly when val not empty', (done) => {
      dataDb.get(testObjectStoreName, testIndex, testVal)
        .then(() => {
          sandbox.assert.calledWithExactly(getStub, testVal);
          sandbox.assert.calledWithExactly(indexStub, testIndex);
          sandbox.assert.calledWithExactly(objectStoreStub, testObjectStoreName);
          sandbox.assert.calledWithExactly(transactionStub, testObjectStoreName);
          done();
        }).catch(done);
    });
    it('should invoke properly when val empty', (done) => {
      dataDb.get(testObjectStoreName, testIndex)
        .then(() => {
          sandbox.assert.calledWithExactly(getStub, testIndex);
          sandbox.assert.calledWithExactly(objectStoreStub, testObjectStoreName);
          sandbox.assert.calledWithExactly(transactionStub, testObjectStoreName);
          done();
        }).catch(done);
    });
  });
  describe('method - getAll unit tests', () => {
    const testObjectStoreName = 'testObjectStore';
    const testKeyRange = {};

    let getAllStub;
    let objectStoreStub;
    let transactionStub;
    beforeEach(() => {
      getAllStub = sandbox.stub();
      objectStoreStub = sandbox.stub().returns({ getAll: getAllStub });
      transactionStub = sandbox.stub().returns({ objectStore: objectStoreStub });
      sandbox.stub(dataDb, 'getOwnDb').returns({ transaction: transactionStub });
    });

    it('should invoke properly when keyRange not empty', (done) => {
      dataDb.getAll(testObjectStoreName, testKeyRange)
        .then(() => {
          sandbox.assert.calledWithExactly(getAllStub, testKeyRange);
          sandbox.assert.calledWithExactly(objectStoreStub, testObjectStoreName);
          sandbox.assert.calledWithExactly(transactionStub, testObjectStoreName);
          done();
        }).catch(done);
    });
    it('should invoke properly when keyRange empty', (done) => {
      dataDb.getAll(testObjectStoreName)
        .then(() => {
          sandbox.assert.calledWithExactly(getAllStub);
          sandbox.assert.calledWithExactly(objectStoreStub, testObjectStoreName);
          sandbox.assert.calledWithExactly(transactionStub, testObjectStoreName);
          done();
        }).catch(done);
    });
  });
  describe('method - add unit tests', () => {
    const testObjectStoreName = 'testObjectStore';
    const errorCompleteParam = 'errorComplete';
    const testData = { test: testObjectStoreName };
    let testDataDb;
    const testSchema = { name: testObjectStoreName };

    let addStub;
    let objectStoreStub;
    let completeStub;
    let transactionStub;
    beforeEach(() => {
      testDataDb = new DataDb(1, testSchema);

      addStub = sandbox.stub();
      objectStoreStub = sandbox.stub().returns({ add: addStub });
      completeStub = sandbox.stub().resolves();
      completeStub.withArgs(errorCompleteParam).rejects();
      transactionStub = sandbox.stub().returns({
        objectStore: objectStoreStub,
        complete: completeStub(),
      });
      sandbox.stub(testDataDb, 'getOwnDb').resolves({
        transaction: transactionStub,
        objectStoreNames: new DOMStringListStub([testObjectStoreName]),
      });
    });

    it('should invoke proper params when add', (done) => {
      testDataDb.add(testObjectStoreName, testData)
        .then(() => {
          sandbox.assert.calledWithExactly(addStub, testData);
          sandbox.assert.calledWithExactly(objectStoreStub, testObjectStoreName);
          sandbox.assert.calledWithExactly(transactionStub, testObjectStoreName, 'readwrite');
          done();
        }).catch(done);
    });
    it('should throw error when non-existent objectStoreName provided', (done) => {
      testDataDb.add(testObjectStoreName.slice(1), testData)
        .catch(() => done())
        .then(done);
    });
    it('should resolve new key when add succeeded', (done) => {
      const newKey = 233;
      addStub.resolves(newKey);
      testDataDb.add(testObjectStoreName, testData)
        .then((key) => {
          expect(key).to.equal(newKey);
          done();
        }).catch(done);
    });
    it('should reject when add failed', (done) => {
      addStub.rejects();
      testDataDb.add(testObjectStoreName, testData)
        .catch(() => done())
        .then(() => done('Should reject but it resolves.'));
    });
  });
  describe('method - update unit tests', () => {
    const testObjectStoreName = 'testObjectStore';
    const errorCompleteParam = 'errorComplete';
    const testData = { test: testObjectStoreName };
    const testKeyPathVal = 1;
    let testDataDb;
    const testSchema = { name: testObjectStoreName };

    let putStub;
    let objectStoreStub;
    let completeStub;
    let transactionStub;
    beforeEach(() => {
      testDataDb = new DataDb(1, testSchema);

      putStub = sandbox.stub();
      objectStoreStub = sandbox.stub().returns({ put: putStub });
      completeStub = sandbox.stub().resolves();
      completeStub.withArgs(errorCompleteParam).rejects();
      transactionStub = sandbox.stub().returns({
        objectStore: objectStoreStub,
        complete: completeStub(),
      });
      sandbox.stub(testDataDb, 'getOwnDb').resolves({
        transaction: transactionStub,
        objectStoreNames: new DOMStringListStub([testObjectStoreName]),
      });
    });

    it('should invoke proper params when update', (done) => {
      testDataDb.update(testObjectStoreName, testData, testKeyPathVal)
        .then(() => {
          sandbox.assert.calledWithExactly(putStub, testData, testKeyPathVal);
          sandbox.assert.calledWithExactly(objectStoreStub, testObjectStoreName);
          sandbox.assert.calledWithExactly(transactionStub, testObjectStoreName, 'readwrite');
          done();
        }).catch(done);
    });
    it('should throw error when non-existent objectStoreName provided', (done) => {
      testDataDb.update(testObjectStoreName.slice(1), testData, testKeyPathVal)
        .catch(() => done())
        .then(done);
    });
    it('should throw error when not providing out-of-line key objectStore with keyPathVal', (done) => {
      testDataDb.update(testObjectStoreName, testData)
        .catch(() => done())
        .then(() => done('Should reject but it resolves'));
    });
    it('should throw error when providing in-line key objectStore with keyPathVal', (done) => {
      objectStoreStub.returns({ put: putStub, keyPath: randStr() });
      testDataDb.update(testObjectStoreName, testData, testKeyPathVal)
        .catch(() => done())
        .then(() => done('Should reject but it resolves'));
    });
    it('should resolve new key when update succeeded', (done) => {
      const newKey = 233;
      putStub.resolves(newKey);
      testDataDb.update(testObjectStoreName, testData, testKeyPathVal)
        .then((key) => {
          expect(key).to.equal(newKey);
          done();
        }).catch(done);
    });
    it('should reject when update failed', (done) => {
      putStub.rejects();
      testDataDb.update(testObjectStoreName, testData, testKeyPathVal)
        .catch(() => done())
        .then(() => done('Should reject but it resolves.'));
    });
  });
  describe('method - delete unit tests', () => {
    const testObjectStoreName = 'testObjectStore';
    const testKeyPathVal = 'testKeyPathVal';
    const errorCompleteParam = 'errorComplete';

    let testDataDb;
    const testSchema = { name: testObjectStoreName };

    let deelteStub;
    let objectStoreStub;
    let completeStub;
    let transactionStub;
    beforeEach(() => {
      testDataDb = new DataDb(1, testSchema);

      deelteStub = sandbox.stub();
      objectStoreStub = sandbox.stub().returns({ delete: deelteStub });
      completeStub = sandbox.stub().resolves(233);
      completeStub.withArgs(errorCompleteParam).rejects();
      transactionStub = sandbox.stub().returns({
        objectStore: objectStoreStub,
        complete: completeStub,
      });
      sandbox.stub(testDataDb, 'getOwnDb').resolves({
        transaction: transactionStub,
        objectStoreNames: new DOMStringListStub([testObjectStoreName]),
      });
    });

    it('should invoke proper params when delete', (done) => {
      testDataDb.delete(testObjectStoreName, testKeyPathVal)
        .then(() => {
          sandbox.assert.calledWithExactly(deelteStub, testKeyPathVal);
          sandbox.assert.calledWithExactly(objectStoreStub, testObjectStoreName);
          sandbox.assert.calledWithExactly(transactionStub, testObjectStoreName, 'readwrite');
          done();
        }).catch(done);
    });
    it('should throw error when non-existent objectStoreName provided', (done) => {
      testDataDb.delete(testObjectStoreName.slice(1), testKeyPathVal)
        .catch(() => done())
        .then(done);
    });
    it('should handle transaction error outside', (done) => {
      testDataDb.delete(testObjectStoreName, testKeyPathVal)
        .then(res => res(errorCompleteParam))
        .catch(() => done());
    });
  });
});
describe('dataDb unit tests', () => {
  it('sanity - should dataDb be properly imported', () => {
    expect(dataDb).to.be.an.instanceOf(DataDb);
  });
});
