import { createSandbox } from 'sinon';
import { pick } from 'lodash';

import {
  storeLanguagePreference,
  __RewireAPI__ as storageRewireAPI,
  retrieveLanguagePreference,
  storeSubtitle,
  retrieveSubtitles,
  deleteSubtitles,
  storeSubtitleList,
  retrieveSubtitleList,
  updateSubtitle,
} from '@/helpers/subtitle/storage';
import { SUBTITLE_OBJECTSTORE_NAME, DATADB_SHCEMAS, DATADB_VERSION } from '@/constants';
import dataDb from '@/helpers/dataDb';

const randStr = () => Math.random().toString(36).substring(7);
const errorVideoSrc = '11-22-33-44';
const emptyVideoSrc = 'empty';

describe('helper - subtitle - storage', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('language preference storage unit tests', () => {
    const recentPlaySchemaName = 'recent-played';
    const databaseIndexName = 'path';
    let videoSrc;
    let infoDBGetStub;
    let infoDBAddStub;

    beforeEach(() => {
      videoSrc = randStr();

      infoDBGetStub = sandbox.stub().resolves({});
      infoDBGetStub.withArgs(
        recentPlaySchemaName,
        databaseIndexName,
        emptyVideoSrc,
      ).resolves();
      infoDBGetStub.withArgs(errorVideoSrc).rejects();
      infoDBAddStub = sandbox.stub().resolves();
      infoDBAddStub.withArgs(errorVideoSrc).rejects();
      storageRewireAPI.__Rewire__('infoDB', { get: infoDBGetStub, add: infoDBAddStub });
    });
    afterEach(() => {
      storageRewireAPI.__ResetDependency__('infoDB');
    });

    describe('storeLanguagePreference unit test', () => {
      it('should storeLanguagePreference invoke infoDB.get', () => {
        storeLanguagePreference(videoSrc);

        sandbox.assert.calledWithExactly(
          infoDBGetStub,
          recentPlaySchemaName,
          databaseIndexName,
          videoSrc,
        );
      });

      it('should storeLanguagePreferece invoke infoDB.add', (done) => {
        const testLangugaePreference = ['en', 'jp'];
        storeLanguagePreference(videoSrc, testLangugaePreference)
          .then(() => {
            sandbox.assert.calledWithExactly(
              infoDBAddStub,
              recentPlaySchemaName,
              {
                preference: {
                  subtitle: {
                    language: testLangugaePreference,
                  },
                },
              },
            );
            done();
          })
          .catch(done);
      });

      it('should invoke infoDB.add with videoSrc when no videoInfo found', (done) => {
        const sampleLanguagePreference = ['en', 'zh-TW'];
        storeLanguagePreference(emptyVideoSrc, sampleLanguagePreference)
          .then(() => {
            sandbox.assert.calledWithExactly(
              infoDBAddStub,
              recentPlaySchemaName,
              {
                path: emptyVideoSrc,
                preference: {
                  subtitle: {
                    language: sampleLanguagePreference,
                  },
                },
              },
            );
            done();
          })
          .catch(done);
      });
    });
    describe('retrieveLanguagePreference unit test', () => {
      it('should retrieveLanguagePreferencec invoke infoDB.get', () => {
        retrieveLanguagePreference(videoSrc);

        sandbox.assert.calledWithExactly(
          infoDBGetStub,
          recentPlaySchemaName,
          databaseIndexName,
          videoSrc,
        );
      });

      it('should retrieveLanguagePreference get language preference', (done) => {
        const sampleLanguagePreference = ['en', 'zh-CN'];
        const sampleVideoInfo = {
          preference: {
            subtitle: {
              language: sampleLanguagePreference,
            },
          },
        };
        infoDBGetStub.resolves(sampleVideoInfo);

        retrieveLanguagePreference(videoSrc)
          .then((result) => {
            expect(result).to.deep.equal(sampleLanguagePreference);
            done();
          })
          .catch(done);
      });

      it('should non-existent videoSrc resolves empty array', (done) => {
        retrieveLanguagePreference(videoSrc)
          .then((result) => {
            expect(result).to.deep.equal([]);
            done();
          }).catch(done);
      });
    });

    describe('storeSubtitleList unit tests', () => {
      let testSubtitleList;
      beforeEach(() => {
        testSubtitleList = [1, 2, 3].map(() => randStr());
      });

      it('should storeSubtitleList invoke infoDb.get', (done) => {
        storeSubtitleList(videoSrc, testSubtitleList)
          .then(() => {
            sandbox.assert.calledWithExactly(
              infoDBGetStub,
              recentPlaySchemaName,
              databaseIndexName,
              videoSrc,
            );
            done();
          }).catch(done);
      });

      it('should storeSubtitleList invoke infoDb.add', (done) => {
        storeSubtitleList(videoSrc, testSubtitleList)
          .then(() => {
            sandbox.assert.calledWithExactly(
              infoDBAddStub,
              recentPlaySchemaName,
              {
                preference: {
                  subtitle: {
                    list: testSubtitleList,
                  },
                },
              },
            );
            done();
          }).catch(done);
      });
    });
    describe('retrieveSubtitleList unit tests', () => {
      it('should retrieveSubtitleList invoke infoDb.get', (done) => {
        retrieveSubtitleList(videoSrc)
          .then(() => {
            sandbox.assert.calledWithExactly(
              infoDBGetStub,
              recentPlaySchemaName,
              databaseIndexName,
              videoSrc,
            );
            done();
          }).catch(done);
      });
      it('should retrieveSubtitleList retrieve subtitleList', (done) => {
        const testSubtitleList = [randStr()];
        infoDBGetStub.resolves({ preference: { subtitle: { list: testSubtitleList } } });

        retrieveSubtitleList(videoSrc)
          .then((result) => {
            expect(result).to.deep.equal(testSubtitleList);
            done();
          }).catch(done);
      });
      it('should non-existent videoSrc resolves empty array', (done) => {
        retrieveSubtitleList(videoSrc)
          .then((result) => {
            expect(result).to.deep.equal([]);
            done();
          }).catch(done);
      });
    });
  });

  describe('subtitles storage unit tests', () => {
    const objectStoreName = SUBTITLE_OBJECTSTORE_NAME;
    describe('method - storeSubtitle unit tests', () => {
      const failureSubtitleId = 'failure';
      const failureSubtitle = { id: failureSubtitleId };

      let addStub;
      beforeEach(() => {
        addStub = sandbox.stub(dataDb, 'add').resolves();
        addStub.withArgs(objectStoreName, failureSubtitle).rejects();
      });

      it('should invoke dataDb.add', (done) => {
        const randomSubtitle = { id: randStr() };
        const randomId = randomSubtitle.id;

        storeSubtitle(randomSubtitle)
          .then((id) => {
            sandbox.assert.calledWithExactly(
              addStub,
              SUBTITLE_OBJECTSTORE_NAME,
              randomSubtitle,
            );
            expect(id).to.deep.equal(randomId);
            done();
          }).catch(done);
      });
      it('should only pick proper properties', (done) => {
        const supportedProperties = DATADB_SHCEMAS
          .find(({ version }) => version === DATADB_VERSION)
          .schema
          .find(({ name }) => name === SUBTITLE_OBJECTSTORE_NAME)
          .properties;
        const testSubtitle = {
          // list all possible subtitle properties
          id: randStr(),
          type: randStr(),
          name: randStr(),
          language: randStr(),
          format: randStr(),
          src: randStr(),
          data: randStr(),
          lastOpened: randStr(),
          videoSegments: randStr(),
          rank: randStr(),
        };
        storeSubtitle(testSubtitle)
          .then(() => {
            expect(addStub).to.have.been.calledWithExactly(
              SUBTITLE_OBJECTSTORE_NAME,
              pick(testSubtitle, supportedProperties),
            );
            done();
          }).catch(done);
      });
    });

    describe('method - updateSubtitle unit tests', () => {
      const noResultSubtitleId = 'no-result';
      const twoResultsSubtitleId = 'two-results';
      const twoResultsButNoLastOpenedSubtitleId = 'two-results-no-last-opened';
      const mixedResultsSubtitleId = 'mixed-results';
      let testSubtitleId;

      const result1 = { _id: randStr(), lastOpened: new Date() };
      const result2 = { _id: randStr(), lastOpened: new Date(Date.now() + 1) };
      const resultWithoutLastOpened1 = { _id: randStr(), name: randStr() };
      const resultWithoutLastOpened2 = { _id: randStr(), name: randStr() };
      const testSubtitleInfo = { lastOpened: new Date(Date.now() + 2) };

      let getAllStub;
      let storeSubtitleStub;
      let putStub;
      beforeEach(() => {
        testSubtitleId = randStr();

        getAllStub = sandbox.stub(dataDb, 'getAll').resolves();
        storeSubtitleStub = sandbox.stub().resolves();
        storageRewireAPI.__Rewire__('storeSubtitle', storeSubtitleStub);

        putStub = sandbox.stub(dataDb, 'put').resolves();
      });
      afterEach(() => {
        storageRewireAPI.__ResetDependency__('storeSubtitle');
      });

      it('should invoke dataDB.getAll', (done) => {
        getAllStub.withArgs(
          SUBTITLE_OBJECTSTORE_NAME,
          IDBKeyRange.only(twoResultsSubtitleId),
        ).resolves([result1, result2]);
        updateSubtitle(testSubtitleId, testSubtitleInfo)
          .then(() => {
            expect(getAllStub).to.have.been.calledWith(SUBTITLE_OBJECTSTORE_NAME);
            done();
          }).catch(done);
      });
      it('should invoke dataDb.put when results found', (done) => {
        getAllStub.withArgs(
          SUBTITLE_OBJECTSTORE_NAME,
          IDBKeyRange.only(twoResultsSubtitleId),
        ).resolves([result1, result2]);
        updateSubtitle(twoResultsSubtitleId, testSubtitleInfo)
          .then(() => {
            expect(putStub).to.have.been.called;
            done();
          }).catch(done);
      });
      it('should invoke storeSubtitle when no results found', (done) => {
        getAllStub.withArgs(
          SUBTITLE_OBJECTSTORE_NAME,
          IDBKeyRange.only(noResultSubtitleId),
        ).resolves([]);
        updateSubtitle(noResultSubtitleId, testSubtitleInfo)
          .then(() => {
            console.log(testSubtitleInfo);
            expect(storeSubtitleStub).to.have.been.calledWithExactly(testSubtitleInfo);
            done();
          }).catch(done);
      });
      it('should update the latest when multiple results found', (done) => {
        getAllStub.withArgs(
          SUBTITLE_OBJECTSTORE_NAME,
          IDBKeyRange.only(twoResultsSubtitleId),
        ).resolves([result1, result2]);
        updateSubtitle(twoResultsSubtitleId, testSubtitleInfo)
          .then(() => {
            expect(putStub).to.have.been.calledWithExactly(
              SUBTITLE_OBJECTSTORE_NAME,
              { ...result2, ...testSubtitleInfo },
              result2._id,
            );
            done();
          }).catch(done);
      });
      it('should update the first when lastOpened not found on all results', (done) => {
        getAllStub.withArgs(
          SUBTITLE_OBJECTSTORE_NAME,
          IDBKeyRange.only(twoResultsButNoLastOpenedSubtitleId),
        ).resolves([resultWithoutLastOpened1, resultWithoutLastOpened2]);
        updateSubtitle(twoResultsButNoLastOpenedSubtitleId, testSubtitleInfo)
          .then(() => {
            expect(putStub).to.have.been.calledWithExactly(
              SUBTITLE_OBJECTSTORE_NAME,
              { ...resultWithoutLastOpened1, ...testSubtitleInfo },
              resultWithoutLastOpened1._id,
            );
            done();
          }).catch(done);
      });
      it('should update the latest when lastOpened not found on some results', (done) => {
        getAllStub.withArgs(
          SUBTITLE_OBJECTSTORE_NAME,
          IDBKeyRange.only(mixedResultsSubtitleId),
        ).resolves([result1, result2, resultWithoutLastOpened1, resultWithoutLastOpened2]);
        updateSubtitle(mixedResultsSubtitleId, testSubtitleInfo)
          .then(() => {
            expect(putStub).to.have.been.calledWithExactly(
              SUBTITLE_OBJECTSTORE_NAME,
              { ...result2, ...testSubtitleInfo },
              result2._id,
            );
            done();
          }).catch(done);
      });
    });

    it('should retrieveSubtitles invoke getAll', (done) => {
      const getAllStub = sandbox.stub(dataDb, 'getAll');
      const onlyStub = sandbox.stub(IDBKeyRange, 'only');
      const testMediaIdentity = randStr();

      retrieveSubtitles(testMediaIdentity)
        .then(() => {
          sandbox.assert.calledWithExactly(onlyStub, testMediaIdentity);
          sandbox.assert.calledWith(getAllStub, SUBTITLE_OBJECTSTORE_NAME);
          done();
        }).catch(done);
    });

    describe('method - deleteSubtitles', () => {
      let testSubtitleIds;
      const failureSubtitleId = 'failure';

      let deleteStub;
      beforeEach(() => {
        testSubtitleIds = [randStr(), failureSubtitleId];
        deleteStub = sandbox.stub(dataDb, 'delete').resolves();
        deleteStub.withArgs(objectStoreName, failureSubtitleId).rejects();
      });

      it('should return empty arrays when empty subtitleIds provided', (done) => {
        const subtitleIds = [];
        deleteSubtitles(subtitleIds)
          .then(({ success, failure }) => {
            expect(success).to.deep.equal([]);
            expect(failure).to.deep.equal([]);
            done();
          }).catch(done);
      });
      it('should return empty arrays when invalid subtitleIds provided', (done) => {
        const subtitleIds = undefined;
        deleteSubtitles(subtitleIds)
          .then(({ success, failure }) => {
            expect(success).to.deep.equal([]);
            expect(failure).to.deep.equal([]);
            done();
          }).catch(done);
      });
      it('should return empty arrays when string subtitleIds provided', (done) => {
        const subtitleIds = 'test';
        deleteSubtitles(subtitleIds)
          .then(({ success, failure }) => {
            expect(success).to.deep.equal([]);
            expect(failure).to.deep.equal([]);
            done();
          }).catch(done);
      });
      it('should invoke dataDb.delete', (done) => {
        deleteSubtitles(testSubtitleIds)
          .then(() => {
            sandbox.assert.calledWithExactly(
              deleteStub,
              SUBTITLE_OBJECTSTORE_NAME,
              testSubtitleIds[0],
            );
            done();
          }).catch(done);
      });
      it('should slience errors to failure', (done) => {
        deleteSubtitles(testSubtitleIds)
          .then(({ success, failure }) => {
            expect(success).to.deep.equal([testSubtitleIds[0]]);
            expect(failure).to.deep.equal([failureSubtitleId]);
            done();
          }).catch(done);
      });
    });
  });
});
