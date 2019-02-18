import { createSandbox } from 'sinon';

import {
  storeLanguagePreference,
  __RewireAPI__ as storageRewireAPI,
  retrieveLanguagePreference,
  storeSubtitles,
  retrieveSubtitles,
  deleteSubtitles,
  storeSubtitleList,
  retrieveSubtitleList,
} from '@/helpers/subtitle/storage';
import { SUBTITLE_OBJECTSTORE_NAME } from '@/constants';
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
    describe('method - storeSubtitles unit tests', () => {
      const failureSubtitleId = 'failure';
      const failureSubtitle = { id: failureSubtitleId };

      let addStub;
      beforeEach(() => {
        addStub = sandbox.stub(dataDb, 'add').resolves();
        addStub.withArgs(objectStoreName, failureSubtitle).rejects();
      });

      it('should invoke dataDb.add', (done) => {
        const randomSubtitles = [1, 2, 3, 4, 5].map(() => ({ id: randStr() }));
        const randomIds = randomSubtitles.map(({ id }) => id);

        storeSubtitles(randomSubtitles)
          .then(({ success, failure }) => {
            sandbox.assert.calledWithExactly(
              addStub,
              SUBTITLE_OBJECTSTORE_NAME,
              randomSubtitles[0],
            );
            expect(success).to.deep.equal(randomIds);
            expect(failure).to.deep.equal([]);
            done();
          }).catch(done);
      });
      it('should slience error to failure ids', (done) => {
        const randomSubtitles = [{ id: randStr() }, failureSubtitle];

        storeSubtitles(randomSubtitles)
          .then(({ success, failure }) => {
            expect(success).to.deep.equal([randomSubtitles[0].id]);
            expect(failure).to.deep.equal([failureSubtitleId]);
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
