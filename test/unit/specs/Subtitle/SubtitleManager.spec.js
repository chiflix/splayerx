import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import sinon from 'sinon';
import Subtitle from '@/store/modules/Subtitle';
import Video from '@/store/modules/Video';
import Preference from '@/store/modules/Preference';
import SubtitleManager from '@/components/Subtitle/SubtitleManager.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

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
    const randStr = () => Math.random().toString(36).substring(7);
    const generateMediaIdentity = () => `${randStr()}-${randStr()}-${randStr()}-${randStr()}`;

    let videoSrc;
    beforeEach(() => {
      videoSrc = randStr();
    });

    it('should throw error when no valid types provided', (done) => {
      wrapper.vm.refreshSubtitles([])
        .then(res => done(res))
        .catch((err) => {
          expect(err).to.be.an.instanceOf(Error).with.property('message', 'No valid subtitle type provided.');
          done();
        });
    });
    it('should invoke getLocalSubtitlesList when types includes local', () => {
      const getLocalSubtitlesListSpy = sandbox.spy(wrapper.vm, 'getLocalSubtitlesList');

      wrapper.vm.refreshSubtitles(['local'], videoSrc);

      sandbox.assert.calledWithExactly(getLocalSubtitlesListSpy, videoSrc);
    });
    it('should invoke getEmbeddedSubtitlesList when types includes embedded', () => {
      const getEmbeddedSubtitlesListSpy = sandbox.spy(wrapper.vm, 'getEmbeddedSubtitlesList');

      wrapper.vm.refreshSubtitles(['embedded'], videoSrc);

      sandbox.assert.calledWithExactly(getEmbeddedSubtitlesListSpy, videoSrc);
    });
    it('should invoke resetOnlineSubtitles when types includes online', () => {
      const resetOnlineSubtitlesSpy = sandbox.spy(wrapper.vm, 'resetOnlineSubtitles');

      wrapper.vm.refreshSubtitles(['online'], videoSrc);

      sandbox.assert.calledOnce(resetOnlineSubtitlesSpy);
    });
    it('should invoke getOnlineSubtitlesList when types includes online', () => {
      const getOnlineSubtitlesListSpy = sandbox.spy(wrapper.vm, 'getOnlineSubtitlesList');

      wrapper.vm.refreshSubtitles(['online'], videoSrc);

      sandbox.assert.calledWithExactly(getOnlineSubtitlesListSpy, videoSrc, wrapper.vm.preferredLanguages);
    });

    it('should refreshSubtitles set selectionComplete to false', () => {
      wrapper.setData({ selectionComplete: true });
      expect(wrapper.vm.selectionComplete).to.equal(true);

      wrapper.vm.refreshSubtitles(['local'], videoSrc);
      expect(wrapper.vm.selectionComplete).to.equal(false);
    });

    it('should invoke checkCurrentSubtitleList', () => {
      const checkCurrentSubtitleListSpy = sandbox.spy(wrapper.vm, 'checkCurrentSubtitleList');

      wrapper.vm.refreshSubtitles(['local'], videoSrc);

      sandbox.assert.calledOnce(checkCurrentSubtitleListSpy);
    });

    it('should emit bus event "refresh-finished" when all subtitles are loaded', (done) => {
      const eventBusEmitSpy = sandbox.spy(wrapper.vm.$bus, '$emit');
      wrapper.vm.refreshSubtitles(['local'], videoSrc)
        .then(() => {
          sandbox.assert.calledWithExactly(eventBusEmitSpy, 'refresh-finished');
          done();
        })
        .catch(err => done(err));
    });

    it('should invoke checkCurrentSubtitleList when all subtitles are loaded', () => {
      const checkCurrentSubtitleListSpy = sandbox.spy(wrapper.vm, 'checkCurrentSubtitleList');

      wrapper.vm.refreshSubtitles(['local'], videoSrc)
        .then(() => {
          sandbox.assert.calledOnce(checkCurrentSubtitleListSpy);
          done();
        })
        .catch(err => done(err));
    });
  });
});
