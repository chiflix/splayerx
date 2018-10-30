import Vuex from 'vuex';
import WindowState from '@/store/modules/WindowState.js';
import PlaybackState from '@/store/modules/PlaybackState.js';
import RecentPlaylist from '@/components/PlayingView/RecentPlaylist.vue';
import { shallowMount, createLocalVue } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('RecentPlaylist.vue', () => {
  let wrapper;
  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        WindowState: {
          state: WindowState.state,
          mutations: WindowState.mutations,
          getters: WindowState.getters,
        },
        PlaybackState: {
          state: PlaybackState.state,
          mutations: PlaybackState.mutations,
          getters: PlaybackState.getters,
        },
      },
    });
    wrapper = shallowMount(RecentPlaylist, { store, localVue });
  });
  describe.only('computed property', () => {
    describe('thumbnailNumber', () => {
      it('winWidth < 512', () => {
        store.commit('windowSize', [500, 0]);
        expect(wrapper.vm.thumbnailNumber).equal(0);
      });
      it('winWidth = 512', () => {
        store.commit('windowSize', [512, 0]);
        expect(wrapper.vm.thumbnailNumber).equal(3);
      });
      it('winWidth = 639', () => {
        store.commit('windowSize', [639, 0]);
        expect(wrapper.vm.thumbnailNumber).equal(4);
      });
      it('winWidth = 720', () => {
        store.commit('windowSize', [720, 0]);
        expect(wrapper.vm.thumbnailNumber).equal(5);
      });
      it('winWidth = 847', () => {
        store.commit('windowSize', [847, 0]);
        expect(wrapper.vm.thumbnailNumber).equal(6);
      });
      it('winWidth = 947', () => {
        store.commit('windowSize', [947, 0]);
        expect(wrapper.vm.thumbnailNumber).equal(6);
      });
      it('winWidth > 1355', () => {
        store.commit('windowSize', [1355, 0]);
        expect(wrapper.vm.thumbnailNumber).equal(10);
      });
    });
  });
});

