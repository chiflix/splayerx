import { createSandbox, match } from 'sinon';
import { pick, differenceWith, isEqual } from 'lodash';

import {
  storeLanguagePreference,
  __RewireAPI__ as storageRewireAPI,
  retrieveLanguagePreference,
  storeSubtitle,
  retrieveSubtitle,
  deleteSubtitles,
  storeSubtitleList,
  retrieveSubtitleList,
  updateSubtitle,
  updateSubtitleList,
} from '@/helpers/subtitle/storage';
import { SUBTITLE_OBJECTSTORE_NAME, DATADB_SHCEMAS, DATADB_VERSION } from '@/constants';
import dataDb from '@/helpers/dataDb';
import { randNum, randStr } from '../../../helpers';

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
    const mediaItemSchemaName = 'media-item';
    const databaseIndexName = 'path';
    let videoSrc;
    let infoDBGetStub;
    let infoDBAddStub;

    beforeEach(() => {
      videoSrc = randStr();

      infoDBGetStub = sandbox.stub().resolves({});
      infoDBGetStub.withArgs(
        mediaItemSchemaName,
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
              mediaItemSchemaName,
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
              mediaItemSchemaName,
              {
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
        testSubtitleList = [1, 2, 3].map(() => ({ id: randNum() }));
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
            const veryDeepArrayMatcher = match(arr => !differenceWith(
              arr, testSubtitleList,
              isEqual,
            ).length);
            expect(infoDBAddStub).to.have.been.calledWithMatch(
              mediaItemSchemaName,
              match.hasNested('preference.subtitle.list', veryDeepArrayMatcher),
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
      it('should no list resolves empty array', (done) => {
        infoDBGetStub.resolves({
          preference: {
            subtitle: {},
          },
        });
        retrieveSubtitleList(videoSrc)
          .then((result) => {
            expect(result).to.deep.equal([]);
            done();
          }).catch(done);
      });
    });
    describe('updateSubtitleList', () => {
      let testVideoSrc;
      let testNewSubtitles;
      let retrieveSubtitleListStub;
      let storeSubtitleListStub;
      beforeEach(() => {
        testVideoSrc = randStr();
        testNewSubtitles = [{ id: randStr() }, { id: randStr() }];

        retrieveSubtitleListStub = sandbox.stub().resolves([]);
        storageRewireAPI.__Rewire__('retrieveSubtitleList', retrieveSubtitleListStub);
        storeSubtitleListStub = sandbox.stub().resolves([]);
        storageRewireAPI.__Rewire__('storeSubtitleList', storeSubtitleListStub);
      });
      afterEach(() => {
        storageRewireAPI.__ResetDependency__('retrieveSubtitleList');
        storageRewireAPI.__ResetDependency__('storeSubtitleList');
      });

      it('should directly return false when no newSubtitles available', (done) => {
        updateSubtitleList(testVideoSrc)
          .then((result) => {
            expect(result).to.be.false;
            expect(retrieveSubtitleListStub).to.not.have.been.called;
            expect(storeSubtitleListStub).to.not.have.been.called;
            done();
          }).catch(done);
      });
      it('should invoke storeSubtitleList with videoSrc', (done) => {
        updateSubtitleList(testVideoSrc, testNewSubtitles)
          .then(() => {
            expect(storeSubtitleListStub).to.have.been.calledWith(testVideoSrc);
            done();
          }).catch(done);
      });
      it('should invoke storeSubtitleList with subtitleList', (done) => {
        const testSubtitleId1 = randStr();
        const testSubtitleId2 = randStr();
        const testSubtitleId3 = randStr();
        retrieveSubtitleListStub.resolves([
          { id: testSubtitleId1, language: 'zh-CN' },
          { id: testSubtitleId2, type: 'local' },
          { id: testSubtitleId3, format: 'ass' },
        ]);
        const testSubtitleList = [
          { id: testSubtitleId1, delay: 0 },
          { id: testSubtitleId2, language: 'zh-CN', type: 'online' },
        ];

        updateSubtitleList(testVideoSrc, testSubtitleList)
          .then(() => {
            expect(storeSubtitleListStub).to.have.been.calledWithMatch(
              testVideoSrc,
              testSubtitleList,
            );
            done();
          }).catch(done);
      });
    });
  });

  describe('subtitles storage unit tests', () => {
    const objectStoreName = SUBTITLE_OBJECTSTORE_NAME;
    describe('method - storeSubtitle unit tests', () => {
      let testSubtitle;
      let addStub;
      beforeEach(() => {
        testSubtitle = { src: randStr() };
        addStub = sandbox.stub(dataDb, 'add').resolves();
      });

      it('should invoke dataDb.add', (done) => {
        storeSubtitle(testSubtitle)
          .then(() => {
            sandbox.assert.calledWithExactly(
              addStub,
              SUBTITLE_OBJECTSTORE_NAME,
              testSubtitle,
            );
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
      it('should resolve what dataDb.add resolves', (done) => {
        const newKey = 233;
        addStub.resolves(newKey);

        storeSubtitle(testSubtitle)
          .then((result) => {
            expect(result).to.equal(newKey);
            done();
          }).catch(done);
      });
      it('should reject what dataDb.add rejects', (done) => {
        const newError = new Error();
        addStub.rejects(newError);

        storeSubtitle(testSubtitle)
          .catch((err) => {
            expect(err).to.equal(newError);
            done();
          }).then(() => done('Should reject but it resolves.'));
      });
    });

    describe('method - updateSubtitle unit tests', () => {
      const hasResultSubtitleId = randNum();
      const noResultSubtitleId = randNum();
      let testSubtitleId;

      const result = { _id: randNum(), lastOpened: new Date() };
      const testSubtitleInfo = { lastOpened: new Date(Date.now() + 2) };

      let getStub;
      let storeSubtitleStub;
      let updateStub;
      beforeEach(() => {
        testSubtitleId = randNum();
        getStub = sandbox.stub(dataDb, 'get').resolves();
        getStub.withArgs(
          SUBTITLE_OBJECTSTORE_NAME,
          hasResultSubtitleId,
        ).resolves(result);
        getStub.withArgs(
          SUBTITLE_OBJECTSTORE_NAME,
          noResultSubtitleId,
        ).resolves();
        storeSubtitleStub = sandbox.stub().resolves();
        storageRewireAPI.__Rewire__('storeSubtitle', storeSubtitleStub);

        updateStub = sandbox.stub(dataDb, 'update').resolves();
      });
      afterEach(() => {
        storageRewireAPI.__ResetDependency__('storeSubtitle');
      });

      it('should invoke dataDB.get', (done) => {
        testSubtitleId = hasResultSubtitleId;
        updateSubtitle(testSubtitleId, testSubtitleInfo)
          .then(() => {
            expect(getStub).to.have.been.calledWithExactly(
              SUBTITLE_OBJECTSTORE_NAME,
              testSubtitleId,
            );
            done();
          }).catch(done);
      });
      it('should turn string subtitleId into number', (done) => {
        const testSubtitleStringId = hasResultSubtitleId.toString();
        updateSubtitle(testSubtitleStringId, testSubtitleInfo)
          .then(() => {
            expect(getStub).to.have.been.calledWithMatch(match.any, hasResultSubtitleId);
            expect(updateStub)
              .to.have.been.calledWithMatch(match.any, match.any, hasResultSubtitleId);
            done();
          }).catch(done);
      });
      it('should invoke dataDb.update when result found', (done) => {
        testSubtitleId = hasResultSubtitleId;
        updateSubtitle(testSubtitleId, testSubtitleInfo)
          .then(() => {
            expect(updateStub).to.have.been.calledWithExactly(
              SUBTITLE_OBJECTSTORE_NAME,
              { ...result, ...testSubtitleInfo },
              testSubtitleId,
            );
            done();
          }).catch(done);
      });
      it('should invoke storeSubtitle when no results found', (done) => {
        testSubtitleId = noResultSubtitleId;
        updateSubtitle(testSubtitleId, testSubtitleInfo)
          .then(() => {
            expect(storeSubtitleStub).to.have.been.calledWithExactly(testSubtitleInfo);
            done();
          }).catch(done);
      });
      it('should resolve what dataDb.update resolves', (done) => {
        const newKey = 233;
        updateStub.resolves(newKey);

        updateSubtitle(hasResultSubtitleId, testSubtitleInfo)
          .then((result) => {
            expect(result).to.equal(newKey);
            done();
          }).catch(done);
      });
      it('should reject what dataDb.update rejects', (done) => {
        const newError = new Error();
        updateStub.rejects(newError);

        updateSubtitle(hasResultSubtitleId, testSubtitleInfo)
          .catch((err) => {
            expect(err).to.equal(newError);
            done();
          }).then(() => done('Should reject but it resolves.'));
      });
    });

    it('should retrieveSubtitle invoke get', (done) => {
      const getStub = sandbox.stub(dataDb, 'get');
      const testSubtitleId = randNum();

      retrieveSubtitle(testSubtitleId)
        .then(() => {
          expect(getStub).to.have.been.calledWithExactly(
            SUBTITLE_OBJECTSTORE_NAME,
            testSubtitleId,
          );
          done();
        }).catch(done);
    });

    describe('method - deleteSubtitles', () => {
      let testSubtitleIds;
      const failureSubtitleId = randNum();

      let deleteStub;
      beforeEach(() => {
        testSubtitleIds = [randNum(), failureSubtitleId];
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
