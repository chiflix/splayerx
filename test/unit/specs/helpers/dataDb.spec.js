import { createSandbox } from 'sinon';
import { flatten } from 'lodash';
import dataDb, { DataDb, __RewireAPI__ as dataDbRewireAPI } from '@/helpers/dataDb';
import { DOMStringListStub } from '../../helpers';

describe('class DataDb unit tests', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
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
      openDbStub = (dbName, version, upgradeCallback) => {
        upgradeCallback({
          objectStoreNames: new DOMStringListStub(['testObjectStore']),
          createObjectStore: createObjectStoreStub,
          transaction: { objectStore: objectStoreStub },
        });
      };
      dataDbRewireAPI.__Rewire__('openDb', openDbStub);
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
});
describe('dataDb unit tests', () => {
  it('sanity - should dataDb be properly imported', () => {
    expect(dataDb).not.to.equal(undefined);
  });
});
