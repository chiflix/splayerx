import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import sinon from 'sinon';
import Subtitle from '@/store/modules/Subtitle';
import Video from '@/store/modules/Video';
import Preference from '@/store/modules/Preference';
import SubtitleManager from '@/components/Subtitle/SubtitleManager.vue';
import SubtitleLoader from '@/components/Subtitle/SubtitleLoader';

const localVue = createLocalVue();
localVue.use(Vuex);
const randStr = () => Math.random().toString(36).substring(7);

describe('Subtitle Manager Unit Tests', () => {
  let store;
  let wrapper;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    store = new Vuex.Store({
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
    });
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
    beforeEach(() => {
      videoSrc = randStr();
      ({ refreshSubtitles } = wrapper.vm);
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
    it('should invoke getLocalSubtitlesList when types includes local', () => {
      const getLocalSubtitlesListSpy = sandbox.spy(wrapper.vm, 'getLocalSubtitlesList');

      refreshSubtitles(['local'], videoSrc);

      sandbox.assert.calledWithExactly(getLocalSubtitlesListSpy, videoSrc);
    });
    it('should invoke getEmbeddedSubtitlesList when types includes embedded', () => {
      const getEmbeddedSubtitlesListSpy = sandbox.spy(wrapper.vm, 'getEmbeddedSubtitlesList');

      refreshSubtitles(['embedded'], videoSrc);

      sandbox.assert.calledWithExactly(getEmbeddedSubtitlesListSpy, videoSrc);
    });
    it('should invoke resetOnlineSubtitles when types includes online', () => {
      const resetOnlineSubtitlesSpy = sandbox.spy(wrapper.vm, 'resetOnlineSubtitles');

      refreshSubtitles(['online'], videoSrc);

      sandbox.assert.calledOnce(resetOnlineSubtitlesSpy);
    });
    it('should invoke getOnlineSubtitlesList when types includes online', () => {
      const getOnlineSubtitlesListSpy = sandbox.spy(wrapper.vm, 'getOnlineSubtitlesList');
      const { preferredLanguages } = wrapper.vm;

      refreshSubtitles(['online'], videoSrc);

      sandbox.assert.calledWithExactly(getOnlineSubtitlesListSpy, videoSrc, preferredLanguages);
    });

    it('should refreshSubtitles set selectionComplete to false', () => {
      wrapper.setData({ selectionComplete: true });
      expect(wrapper.vm.selectionComplete).to.equal(true);

      refreshSubtitles(['local'], videoSrc);
      expect(wrapper.vm.selectionComplete).to.equal(false);
    });

    it('should invoke checkCurrentSubtitleList', () => {
      const checkCurrentSubtitleListSpy = sandbox.spy(wrapper.vm, 'checkCurrentSubtitleList');

      refreshSubtitles(['local'], videoSrc);

      sandbox.assert.calledOnce(checkCurrentSubtitleListSpy);
    });

    it('should emit bus event "refresh-finished" when all subtitles are loaded', (done) => {
      const eventBusEmitSpy = sandbox.spy(wrapper.vm.$bus, '$emit');
      refreshSubtitles(['local'], videoSrc)
        .then(() => {
          sandbox.assert.calledWithExactly(eventBusEmitSpy, 'refresh-finished');
          done();
        })
        .catch(err => done(err));
    });

    it('should invoke checkCurrentSubtitleList when all subtitles are loaded', (done) => {
      const checkCurrentSubtitleListSpy = sandbox.spy(wrapper.vm, 'checkCurrentSubtitleList');

      refreshSubtitles(['local'], videoSrc)
        .then(() => {
          sandbox.assert.called(checkCurrentSubtitleListSpy);
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('method - getLocalSubtitlesList', () => {
    let videoSrc;
    let searchforLocalListStub;
    let getLocalSubtitlesList;

    beforeEach(() => {
      searchforLocalListStub = sandbox.stub().resolves();
      searchforLocalListStub.withArgs('11-22-33-44').rejects();
      SubtitleManager.__Rewire__('searchforLocalList', searchforLocalListStub);
      ({ getLocalSubtitlesList } = wrapper.vm);
    });

    it('should invoke searchforLocalList', () => {
      getLocalSubtitlesList();

      sandbox.assert.calledOnce(searchforLocalListStub);
    });

    it('should invoke searchforLocalList with videoSrc and SubtitleLoader.supportedFormats', () => {
      getLocalSubtitlesList(videoSrc);

      sandbox.assert.calledWithExactly(searchforLocalListStub, videoSrc, SubtitleLoader.supportedFormats);
    });

    it('should slience errors rejected from searchforLocalList', (done) => {
      getLocalSubtitlesList('11-22-33-44')
        .then((results) => {
          expect(results.length).to.equal(0);
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('method - getOnlineSubtitlesList', () => {
    let fetchOnlineListStub;
    let videoSrc;
    let getOnlineSubtitlesList;
    
    beforeEach(() => {
      videoSrc = randStr();

      fetchOnlineListStub = sandbox.stub().resolves(videoSrc.split(''));
      fetchOnlineListStub.withArgs('11-22-33-44').rejects();
      SubtitleManager.__Rewire__('fetchOnlineList', fetchOnlineListStub);

      ({ getOnlineSubtitlesList } = wrapper.vm);
    });

    it('should resolve an empty array when no languages provided', (done) => {
      getOnlineSubtitlesList(videoSrc)
        .then((results) => {
          expect(results)
            .to.be.an.instanceOf(Array)
            .with.property('length', 0);
          done();
        })
        .catch(err => done(err));
    });

    it('should invoke fetchOnlineList', () => {
      getOnlineSubtitlesList(videoSrc, [randStr()]);

      sandbox.assert.called(fetchOnlineListStub);
    });

    it('should invoke fetchOnlineList with videoSrc and language', () => {
      const randomLanguages = [randStr(), randStr()];
      getOnlineSubtitlesList(videoSrc, randomLanguages);

      sandbox.assert.calledWithExactly(fetchOnlineListStub.firstCall, videoSrc, randomLanguages[0]);
      sandbox.assert.calledWithExactly(fetchOnlineListStub.secondCall, videoSrc, randomLanguages[1]);
    });

    it('should slience errors from fetchOnlineList', (done) => {
      const languages = [randStr(), '11-22-33-44'];
      getOnlineSubtitlesList(videoSrc, languages)
        .then((results) => {
          expect(results).to.not.include([...'11-22-33-44'.split('')]);
          done();
        })
        .catch(err => done(err));
    });
  });
});
