import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { createSandbox, match } from 'sinon';
import { merge } from 'lodash';
import Subtitle from '@/store/modules/Subtitle';
import Video from '@/store/modules/Video';
import Preference from '@/store/modules/Preference';
import SubtitleManager, { __RewireAPI__ as subtitleManagerRewireAPI } from '@/components/Subtitle/SubtitleManager.vue';
import SubtitleLoader from '@/components/Subtitle/SubtitleLoader';
import { randNum } from '../../helpers';

const localVue = createLocalVue();
localVue.use(Vuex);
const randStr = () => Math.random().toString(36).substring(7);
const errorVideoSrc = '11-22-33-44';

describe('Subtitle Manager Unit Tests', () => {
  let store;
  const baseStore = {
    modules: {
      Video: {
        state: Video.state,
        getters: Video.getters,
        mutations: Video.mutations,
        actions: Video.mutations,
      },
      Subtitle: {
        state: Subtitle.state,
        getters: Subtitle.getters,
        mutations: Subtitle.mutations,
        actions: Subtitle.actions,
      },
      Preference: {
        state: Preference.state,
        getters: Preference.getters,
        mutations: Preference.mutations,
        actions: Preference.actions,
      },
    },
  };
  let wrapper;
  let sandbox = createSandbox();

  beforeEach(() => {
    sandbox = createSandbox();

    store = new Vuex.Store(baseStore);
    wrapper = shallowMount(SubtitleManager, { localVue, store });
  });

  afterEach(() => {
    wrapper.destroy();
    sandbox.restore();
  });

  it('Sanity test - should SubtitleManager be properly rendered', () => {
    expect(wrapper.contains(SubtitleManager)).to.equal(true);
  });

  describe('method - refreshSubtitles', () => {
    let videoSrc;
    let refreshSubtitles;
    let retrieveLanguagePreferenceStub;
    let retrieveSelectedSubtitleIdStub;
    let retrieveSubtitleListStub;
    let storeLanguagePreferenceStub;
    beforeEach(() => {
      videoSrc = randStr();
      ({ refreshSubtitles } = wrapper.vm);

      retrieveLanguagePreferenceStub = sandbox.stub().resolves();
      subtitleManagerRewireAPI.__Rewire__('retrieveLanguagePreference', retrieveLanguagePreferenceStub);
      retrieveSelectedSubtitleIdStub = sandbox.stub().resolves();
      subtitleManagerRewireAPI.__Rewire__('retrieveSelectedSubtitleId', retrieveSelectedSubtitleIdStub);
      retrieveSubtitleListStub = sandbox.stub().resolves([]);
      subtitleManagerRewireAPI.__Rewire__('retrieveSubtitleList', retrieveSubtitleListStub);
      storeLanguagePreferenceStub = sandbox.stub().resolves();
      subtitleManagerRewireAPI.__Rewire__('storeLanguagePreference', storeLanguagePreferenceStub);
    });
    afterEach(() => {
      subtitleManagerRewireAPI.__ResetDependency__('retrieveLanguagePreference');
      subtitleManagerRewireAPI.__ResetDependency__('retrieveSelectedSubtitleId');
      subtitleManagerRewireAPI.__ResetDependency__('retrieveSubtitleList');
      subtitleManagerRewireAPI.__ResetDependency__('storeLanguagePreference');
    });

    it('should throw error when no valid types provided', (done) => {
      refreshSubtitles([])
        .then(res => done(res))
        .catch((err) => {
          expect(err)
            .to.be.an.instanceOf(Error)
            .with.property('message', 'No valid subtitle type provided.');
          done();
        });
    });
    it('should invoke getLocalSubtitlesList when types includes local', (done) => {
      const getLocalSubtitlesListSpy = sandbox.spy(wrapper.vm, 'getLocalSubtitlesList');

      refreshSubtitles(['local'], videoSrc).then(() => {
        expect(getLocalSubtitlesListSpy).to.have.been.called;
        done();
      }).catch(done);
    });
    it('should invoke getEmbeddedSubtitlesList when types includes embedded', (done) => {
      const getEmbeddedSubtitlesListStub = sandbox.stub(wrapper.vm, 'getEmbeddedSubtitlesList').resolves([]);

      refreshSubtitles(['embedded'], videoSrc)
        .then(() => {
          expect(getEmbeddedSubtitlesListStub).to.have.been.calledWith(videoSrc);
          done();
        }).catch(done);
    });
    it('should invoke resetOnlineSubtitles when types includes online', (done) => {
      const resetOnlineSubtitlesStub = sandbox.stub(wrapper.vm, 'resetOnlineSubtitles').resolves([]);

      refreshSubtitles(['online'], videoSrc)
        .then(() => {
          expect(resetOnlineSubtitlesStub).to.have.been.called;
          done();
        }).catch(done);
    });

    it('should refreshSubtitles set selectionComplete to false when not isInitial', (done) => {
      wrapper.setData({ selectionComplete: true });
      wrapper.setData({ selectionSecondaryComplete: true });
      expect(wrapper.vm.selectionComplete).to.equal(true);

      refreshSubtitles(['local'], videoSrc)
        .then(() => {
          expect(wrapper.vm.selectionComplete).to.equal(false);
          expect(wrapper.vm.selectionSecondaryComplete).to.equal(false);
          done();
        }).catch(done);
    });
    it('should invoke checkCurrentSubtitleList twice when not isInitial', (done) => {
      const checkCurrentSubtitleListSpy = sandbox.spy(wrapper.vm, 'checkCurrentSubtitleList');

      refreshSubtitles(['local'], videoSrc)
        .then(() => {
          expect(checkCurrentSubtitleListSpy).to.have.been.calledTwice;
          done();
        }).catch(done);
    });
    // it('should invoke checkCurrentSubtitleList once when isInitial', (done) => {
    //   wrapper.setData({ isInitial: true });
    //   const checkCurrentSubtitleListSpy = sandbox.spy(wrapper.vm, 'checkCurrentSubtitleList');
    //
    //   refreshSubtitles(['local'], videoSrc)
    //     .then(() => {
    //       expect(checkCurrentSubtitleListSpy).to.have.been.calledOnce;
    //       done();
    //     }).catch(done);
    // });

    it('should emit bus event "refresh-finished" when all subtitles are loaded', (done) => {
      const eventBusEmitSpy = sandbox.spy(wrapper.vm.$bus, '$emit');
      refreshSubtitles(['local'], videoSrc)
        .then(() => {
          sandbox.assert.calledWith(eventBusEmitSpy, 'refresh-finished');
          done();
        })
        .catch(done);
    });

    it('should invoke checkCurrentSubtitleList when all subtitles are loaded', (done) => {
      const checkCurrentSubtitleListSpy = sandbox.spy(wrapper.vm, 'checkCurrentSubtitleList');

      refreshSubtitles(['local'], videoSrc)
        .then(() => {
          sandbox.assert.called(checkCurrentSubtitleListSpy);
          done();
        })
        .catch(done);
    });

    it('should invoke storeLanguagePreference when all loaded', (done) => {
      refreshSubtitles(['local'], videoSrc)
        .then(() => {
          sandbox.assert.calledWith(
            storeLanguagePreferenceStub,
            videoSrc,
            wrapper.vm.preferredLanguages,
          );
          done();
        }).catch(done);
    });
  });

  describe('method - getLocalSubtitlesList', () => {
    let videoSrc;
    let getLocalSubtitlesList;
    let searchForLocalListStub;

    beforeEach(() => {
      searchForLocalListStub = sandbox.stub().resolves();
      searchForLocalListStub.withArgs(errorVideoSrc).rejects();
      SubtitleManager.__Rewire__('searchForLocalList', searchForLocalListStub);
      ({ getLocalSubtitlesList } = wrapper.vm);
    });
    afterEach(() => {
      SubtitleManager.__ResetDependency__('searchForLocalList');
    });

    it('should invoke searchForLocalList', (done) => {
      getLocalSubtitlesList(videoSrc, [])
        .then(() => {
          expect(searchForLocalListStub).to.have.been.called;
          done();
        }).catch(done);
    });

    it('should invoke searchForLocalList with videoSrc and SubtitleLoader.supportedFormats', () => {
      getLocalSubtitlesList(videoSrc, []);
      const { supportedFormats } = SubtitleLoader;

      sandbox.assert.calledWithExactly(searchForLocalListStub, videoSrc, supportedFormats);
    });

    it('should slience errors rejected from searchForLocalList', (done) => {
      getLocalSubtitlesList(errorVideoSrc, [])
        .then((results) => {
          expect(results.length).to.equal(0);
          done();
        })
        .catch(done);
    });
  });

  describe('method - getOnlineSubtitlesList', () => {
    let videoSrc;
    let testStoredSubIds;
    let getOnlineSubtitlesList;
    let fetchOnlineListStub;

    beforeEach(() => {
      videoSrc = randStr();
      testStoredSubIds = [];
      ({ getOnlineSubtitlesList } = wrapper.vm);

      fetchOnlineListStub = sandbox.stub().resolves(videoSrc.split(''));
      fetchOnlineListStub.withArgs(errorVideoSrc).rejects();
      SubtitleManager.__Rewire__('fetchOnlineList', fetchOnlineListStub);
    });

    afterEach(() => {
      SubtitleManager.__ResetDependency__('fetchOnlineList');
    });

    it('should resolve an empty array when no languages provided', (done) => {
      getOnlineSubtitlesList(videoSrc, true, testStoredSubIds, [])
        .then((results) => {
          expect(results).to.deep.equal([]);
          done();
        })
        .catch(done);
    });

    it('should invoke fetchOnlineList', (done) => {
      getOnlineSubtitlesList(videoSrc, true, testStoredSubIds, [randStr()])
        .then(() => {
          expect(fetchOnlineListStub).to.have.been.called;
          done();
        }).catch(done);
    });

    it('should invoke fetchOnlineList with videoSrc and language', (done) => {
      const randomLanguages = [randStr(), randStr()];
      getOnlineSubtitlesList(videoSrc, true, testStoredSubIds, randomLanguages)
        .then(() => {
          expect(fetchOnlineListStub).to.have.been.calledWith(videoSrc, randomLanguages[0]);
          expect(fetchOnlineListStub).to.have.been.calledWith(videoSrc, randomLanguages[1]);
          done();
        }).catch(done);
    });

    it('should slience errors from fetchOnlineList', (done) => {
      const languages = [randStr(), errorVideoSrc];
      getOnlineSubtitlesList(videoSrc, true, testStoredSubIds, languages)
        .then((results) => {
          expect(results).to.not.include([...errorVideoSrc.split('')]);
          done();
        })
        .catch(done);
    });
  });

  describe('method - getEmbeddedSubtitlesList', () => {
    let videoSrc;
    let getEmbeddedSubtitlesList;
    let retrieveEmbeddedListStub;

    beforeEach(() => {
      videoSrc = randStr();
      ({ getEmbeddedSubtitlesList } = wrapper.vm);

      retrieveEmbeddedListStub = sandbox.stub().resolves();
      retrieveEmbeddedListStub.withArgs(errorVideoSrc).rejects();
      SubtitleManager.__Rewire__('retrieveEmbeddedList', retrieveEmbeddedListStub);
    });
    afterEach(() => {
      SubtitleManager.__ResetDependency__('retrieveEmbeddedList');
    });

    it('should invoke retrieveEmbeddedList', () => {
      getEmbeddedSubtitlesList(videoSrc);

      sandbox.assert.called(retrieveEmbeddedListStub);
    });

    it('should invoke retrieveEmbeddedList with videoSrc and SubtitleLoader.supportedCodecs', () => {
      getEmbeddedSubtitlesList(videoSrc);
      const { supportedCodecs } = SubtitleLoader;

      sandbox.assert.calledWithExactly(retrieveEmbeddedListStub, videoSrc, supportedCodecs);
    });

    it('should slience errors rejected from retrieveEmbeddedList to an empty array', (done) => {
      getEmbeddedSubtitlesList(errorVideoSrc, [])
        .then((results) => {
          expect(results).to.deep.equal([]);
          done();
        })
        .catch(done);
    });
  });

  describe('method - addSubttile', () => {
    let SubtitleLoaderStub;
    beforeEach(() => {
      SubtitleLoaderStub = sandbox.stub();
      subtitleManagerRewireAPI.__Rewire__('SubtitleLoader', SubtitleLoaderStub);
    });
    afterEach(() => {
      subtitleManagerRewireAPI.__ResetDependency__('SubtitleLoader');
    });
    it('should generate a new SubtitleLoader instance when no one exist', (done) => {
      store = merge({}, baseStore, {
        modules: {
          Subtitle: {
            getters: {
              subtitleList: () => [],
            },
          },
        },
      });
      wrapper = shallowMount(SubtitleManager, {
        localVue, store: new Vuex.Store(store),
      });
      wrapper.setData({ subtitleInstances: {} });
      wrapper.vm.setupListeners = sandbox.stub();
      const testSubtitle = {
        src: randStr(),
        type: 'online',
        options: { [randStr()]: randStr() },
      };
      const testVideoSrc = randStr();

      wrapper.vm.addSubtitle(testSubtitle, testVideoSrc)
        .then(() => {
          expect(SubtitleLoaderStub).to.have.been.calledWithNew;
          done();
        }).catch(done);
    });
    it('should not generate a new one when already having one', (done) => {
      const testSubtitleSrc = randStr();
      const testSubtitleInfo = {
        id: testSubtitleSrc,
        loading: 'loaded',
      };
      const testSubtitleInstance = {
        src: testSubtitleSrc,
        type: 'online',
        options: { id: testSubtitleSrc },
      };
      store = merge({}, baseStore, {
        modules: {
          Subtitle: {
            getters: {
              subtitleList: () => [testSubtitleInfo],
            },
          },
        },
      });
      wrapper = shallowMount(SubtitleManager, {
        localVue, store: new Vuex.Store(store),
      });
      wrapper.setData({ subtitleInstances: { [testSubtitleSrc]: testSubtitleInstance } });
      wrapper.vm.setupListeners = sandbox.stub();

      wrapper.vm.addSubtitle(testSubtitleInstance, randStr())
        .then(() => {
          expect(SubtitleLoaderStub).to.have.not.been.calledWithNew;
          done();
        }).catch(done);
    });
  });

  describe('method - generateValidSubtitle', () => {
    let subtitleId;
    const testSubtitleId = 'testSubtitle';
    const testSubtitleInstance = {
      type: 'local',
      src: randStr(),
      data: randStr(),
    };
    const testSubtitleInstances = { [testSubtitleId]: testSubtitleInstance };
    const testSubtitleInfo = {
      id: testSubtitleId,
      language: 'zh-CN',
      name: `${randStr()}.ass`,
      rank: 1000,
      format: 'ass',
    };
    const testSubtitleList = [testSubtitleInfo];
    beforeEach(() => {
      subtitleId = randStr();
      const subtitleListStore = merge({}, baseStore, {
        modules: {
          Subtitle: {
            getters: {
              subtitleList: () => testSubtitleList,
            },
          },
        },
      });
      wrapper = shallowMount(SubtitleManager, {
        localVue,
        store: new Vuex.Store(subtitleListStore),
      });
      wrapper.vm.subtitleInstances = testSubtitleInstances;
    });

    it('should throw error when no subtitleInstance found', (done) => {
      testSubtitleList.push({ id: subtitleId });
      wrapper.vm.generateValidSubtitle(subtitleId)
        .catch((err) => {
          expect(err).to.be.an.instanceOf(Error);
          done();
        }).then(done);
    });
    it('should throw error when no subtitleInfo found', (done) => {
      wrapper.vm.subtitleInstances = { ...testSubtitleInstances, subtitleId: {} };
      wrapper.vm.generateValidSubtitle(subtitleId)
        .catch((err) => {
          expect(err).to.be.an.instanceOf(Error);
          done();
        }).then(done);
    });
    it('should resolves the proper subtitleInfo', (done) => {
      wrapper.vm.generateValidSubtitle(testSubtitleId)
        .then((result) => {
          expect(result).to.have.property('id');
          expect(result).to.have.property('type');
          expect(result).to.have.property('src');
          expect(result).to.have.property('format');
          expect(result).to.have.property('language');
          done();
        }).catch(done);
    });
    it('should generate proper subtitleInfo for local subtitles', (done) => {
      wrapper.vm.generateValidSubtitle(testSubtitleId)
        .then((result) => {
          const { src } = testSubtitleInstance;
          const { format } = testSubtitleInfo;
          expect(result).to.have.property('id', testSubtitleId);
          expect(result).to.have.property('type', 'local');
          expect(result).to.have.property('src', src);
          expect(result).to.have.property('format', format);
          expect(result.data).to.not.exist;
          done();
        }).catch(done);
    });
    it('should generate proper subtitleInfo for embedded subtitles', (done) => {
      testSubtitleInstance.type = 'embedded';
      wrapper.vm.generateValidSubtitle(testSubtitleId)
        .then((result) => {
          testSubtitleInstance.type = 'embedded';
          const { src } = testSubtitleInstance;
          const { format } = testSubtitleInfo;
          expect(result).to.have.property('id', testSubtitleId);
          expect(result).to.have.property('type', 'embedded');
          expect(result).to.have.property('src', src);
          expect(result).to.have.property('format', format);
          expect(result.data).to.not.exist;
          done();
        }).catch(done);
    });
    it('should generate proper subtitleInfo for online subtitles', (done) => {
      testSubtitleInstance.type = 'online';
      wrapper.vm.generateValidSubtitle(testSubtitleId)
        .then((result) => {
          testSubtitleInstance.type = 'online';
          const { src, data } = testSubtitleInstance;
          const { format } = testSubtitleInfo;
          expect(result).to.have.property('id', testSubtitleId);
          expect(result).to.have.property('type', 'online');
          expect(result).to.have.property('src', src);
          expect(result).to.have.property('format', format);
          expect(result).to.have.property('data', data);
          done();
        }).catch(done);
    });
  });

  describe('method - generateValidSubtitleList', () => {
    let videoSrc;
    let testVideoSegments;
    const testCurrentSubtitleId = 'testCurrentSubtitleId';
    let testCurrentSubtitle;
    let testSubtitleWithName;
    let testSubtitleList;
    beforeEach(() => {
      videoSrc = randStr();
      testCurrentSubtitle = {
        id: testCurrentSubtitleId,
        src: randStr(),
        type: 'local',
        rank: 9999,
      };
      testVideoSegments = [[Math.random(), Math.random() + 5]];
      testSubtitleWithName = {
        id: randStr(),
        src: randStr(),
        type: 'online',
        name: 'Chinese I',
        rank: 9997,
      };
      testSubtitleList = [testCurrentSubtitle, testSubtitleWithName];
      const subtitleListStore = merge({}, baseStore, {
        modules: {
          Subtitle: {
            getters: {
              currentFirstSubtitleId: () => testCurrentSubtitleId,
              subtitleList: () => testSubtitleList,
            },
          },
          Video: {
            getters: {
              duration: () => 1, // to trigger SubtitleRenderer's v-if
            },
          },
        },
      });
      const SubtitleRendererStub = {
        render(h) { return h('div'); },
        data() { return { videoSegments: testVideoSegments }; },
      };
      wrapper = shallowMount(SubtitleManager, {
        localVue,
        store: new Vuex.Store(subtitleListStore),
        stubs: {
          SubtitleRenderer: SubtitleRendererStub,
        },
      });
      wrapper.setData({
        subtitleInstances: { [testCurrentSubtitleId]: testCurrentSubtitle },
      });
    });

    it('should generateValidSubtitleList generate proper subtitleList', (done) => {
      wrapper.vm.generateValidSubtitleList(videoSrc)
        .then((result) => {
          expect(result).to.has.property('videoSrc', videoSrc);
          result.subtitles.forEach((subtitleInfo) => {
            const {
              id, type, name, rank,
            } = testSubtitleList.find(({ id }) => id === subtitleInfo.id);
            expect(subtitleInfo).to.have.property('id', id);
            expect(subtitleInfo).to.have.property('type', type);
            expect(subtitleInfo).to.have.property('name', name);
            expect(subtitleInfo).to.have.property('rank', rank);
            if (subtitleInfo.id === testCurrentSubtitleId) {
              expect(subtitleInfo).to.have.property('videoSegments', testVideoSegments);
            }
          });
          done();
        }).catch(done);
    });
  });

  describe('method - loadedCallback', () => {
    let testSubtitleInstance;
    let addSubtitleWhenLoadedStub;
    let updateSubtitleStub;
    beforeEach(() => {
      testSubtitleInstance = {
        id: randStr(),
        type: 'online',
        metaInfo: {
          language: 'zh-CN',
        },
        data: [randStr()],
      };
      addSubtitleWhenLoadedStub = sandbox.stub(wrapper.vm, 'addSubtitleWhenLoaded');
      updateSubtitleStub = sandbox.stub();
      subtitleManagerRewireAPI.__Rewire__('updateSubtitle', updateSubtitleStub);
    });
    afterEach(() => {
      subtitleManagerRewireAPI.__ResetDependency__('updateSubtitle');
    });
    it('should invoke addSubtitleWhenLoaded', (done) => {
      wrapper.vm.loadedCallback(testSubtitleInstance)
        .then(() => {
          expect(addSubtitleWhenLoadedStub)
            .to.have.been.calledWithExactly({ id: testSubtitleInstance.id });
          done();
        }).catch(done);
    });
    it('should invoke updateSubtitle', (done) => {
      wrapper.vm.loadedCallback(testSubtitleInstance)
        .then(() => {
          expect(updateSubtitleStub).to.have.been.called;
          done();
        }).catch(done);
    });
    it('should invoke updateSubtitle with language and data when online', (done) => {
      wrapper.vm.loadedCallback(testSubtitleInstance)
        .then(() => {
          expect(updateSubtitleStub).to.have.been.calledWithExactly(
            testSubtitleInstance.id,
            {
              language: testSubtitleInstance.metaInfo.language,
              data: testSubtitleInstance.data,
            },
          );
          done();
        }).catch(done);
    });
    it('should invoke updateSubtitle with only language when not online', (done) => {
      testSubtitleInstance.type = 'local';
      wrapper.vm.loadedCallback(testSubtitleInstance)
        .then(() => {
          expect(updateSubtitleStub).to.have.been.calledWithExactly(
            testSubtitleInstance.id,
            {
              language: testSubtitleInstance.metaInfo.language,
            },
          );
          done();
        }).catch(done);
    });
  });

  describe('method - allSubtitleListWacher', () => {
    let updateSubtitleListStub;
    let testVideoSrc;
    let getVideoSrcByIdStub;
    let idWithVideoSegments;
    let testVideoSegments;
    let loadingSubtitle;
    let failedSubtitle;
    let readySubtitle;
    let loadedSubtitle;
    let testSubtitleInstances;
    const noloading = (sub) => {
      const newSub = { ...sub };
      delete newSub.loading;
      return newSub;
    };
    beforeEach(() => {
      updateSubtitleListStub = sandbox.stub();
      subtitleManagerRewireAPI.__Rewire__('updateSubtitleList', updateSubtitleListStub);
      testVideoSrc = randStr();
      getVideoSrcByIdStub = sandbox.stub().returns(testVideoSrc);
      idWithVideoSegments = randStr();
      testVideoSegments = [[Math.random(), Math.random() + 5]];
      store = merge({}, baseStore, {
        modules: {
          Subtitle: {
            getters: {
              getVideoSrcById: () => getVideoSrcByIdStub,
              currentFirstSubtitleId: () => idWithVideoSegments,
            },
          },
          Video: {
            getters: {
              duration: () => 1, // to trigger SubtitleRenderer's v-if
            },
          },
        },
      });
      const SubtitleRendererStub = {
        render(h) { return h('div'); },
        data() { return { videoSegments: testVideoSegments }; },
      };
      wrapper = shallowMount(SubtitleManager, {
        localVue,
        store: new Vuex.Store(store),
        stubs: {
          SubtitleRenderer: SubtitleRendererStub,
        },
      });

      loadingSubtitle = { id: randNum(), loading: 'loading', src: randStr() };
      failedSubtitle = { id: randNum(), loading: 'failed', src: randStr() };
      readySubtitle = { id: randNum(), loading: 'ready', src: randStr() };
      loadedSubtitle = { id: randNum(), loading: 'loaded', src: randStr() };

      testSubtitleInstances = {
        [loadingSubtitle.id]: loadedSubtitle,
        [failedSubtitle.id]: failedSubtitle,
        [readySubtitle.id]: readySubtitle,
        [loadedSubtitle.id]: loadedSubtitle,
      };
      wrapper.setData({ subtitleInstances: testSubtitleInstances });
    });
    afterEach(() => {
      subtitleManagerRewireAPI.__ResetDependency__('updateSubtitleList');
    });

    it('should invoke updateSubtitleList', (done) => {
      const newVal = [readySubtitle, loadedSubtitle];
      const oldVal = [readySubtitle];

      wrapper.vm.allSubtitleListWatcher(newVal, oldVal)
        .then(() => {
          expect(updateSubtitleListStub).to.have.been.called;
          done();
        }).catch(done);
    });
    it('should only update the new ready or loaded subtitles', (done) => {
      const newVal = [readySubtitle, loadedSubtitle, failedSubtitle, loadingSubtitle];
      const oldVal = [];

      wrapper.vm.allSubtitleListWatcher(newVal, oldVal)
        .then(() => {
          expect(updateSubtitleListStub).to.have.been.calledWithExactly(
            testVideoSrc,
            [noloading(readySubtitle), noloading(loadedSubtitle)],
          );
          done();
        }).catch(done);
    });
    it('should invoke updateSubtitle with proper videoSrc', (done) => {
      const testVideoSrc1 = randStr();
      const testVideoSrc2 = randStr();
      getVideoSrcByIdStub.onFirstCall().returns(testVideoSrc1);
      getVideoSrcByIdStub.onSecondCall().returns(testVideoSrc2);
      const newVal = [readySubtitle, loadedSubtitle];
      const oldVal = [];

      wrapper.vm.allSubtitleListWatcher(newVal, oldVal)
        .then(() => {
          expect(updateSubtitleListStub).to.have.been.calledWithExactly(
            testVideoSrc1,
            [noloading(readySubtitle)],
          );
          expect(updateSubtitleListStub).to.have.been.calledWithExactly(
            testVideoSrc2,
            [noloading(loadedSubtitle)],
          );
          done();
        }).catch(done);
    });
    it('should only pick proper properties', (done) => {
      readySubtitle = {
        id: randStr(),
        loading: 'ready',
        format: 'embedded',
        language: 'zh-CN',
        name: randStr(),
        rank: 10000,
        type: 'embedded',
      };
      const newVal = [readySubtitle];
      const oldVal = [];
      wrapper.vm.allSubtitleListWatcher(newVal, oldVal)
        .then(() => {
          expect(updateSubtitleListStub).to.have.been.calledWithExactly(
            testVideoSrc,
            [{
              id: readySubtitle.id,
              language: readySubtitle.language,
              type: readySubtitle.type,
              rank: readySubtitle.rank,
            }],
          );
          done();
        }).catch(done);
    });
    it('should store videoSegments if available', (done) => {
      const newVal = [{ loading: 'ready', id: idWithVideoSegments }];

      wrapper.vm.allSubtitleListWatcher(newVal, [])
        .then(() => {
          expect(updateSubtitleListStub).to.have.been.called;
          expect(updateSubtitleListStub).to.have.been.calledWithMatch(
            testVideoSrc,
            [match.has('videoSegments', testVideoSegments)],
          );
          done();
        }).catch(done);
    });
  });
});
