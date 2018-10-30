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
  let result;
  const gettersFunction = () => result;
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        WindowState: {
          state: WindowState.state,
          mutations: WindowState.mutations,
          getters: {
            winWidth: gettersFunction,
          },
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
        result = 500;
        expect(wrapper.vm.thumbnailNumber).equal(0);
      });
      it('winWidth = 512', () => {
        result = 512;
        expect(wrapper.vm.thumbnailNumber).equal(3);
      });
      it('winWidth = 639', () => {
        result = 639;
        expect(wrapper.vm.thumbnailNumber).equal(4);
      });
      it('winWidth = 720', () => {
        result = 720;
        expect(wrapper.vm.thumbnailNumber).equal(5);
      });
      it('winWidth = 847', () => {
        result = 847;
        expect(wrapper.vm.thumbnailNumber).equal(6);
      });
      it('winWidth = 947', () => {
        result = 947;
        expect(wrapper.vm.thumbnailNumber).equal(6);
      });
      it('winWidth > 1355', () => {
        result = 1355;
        expect(wrapper.vm.thumbnailNumber).equal(10);
      });
    });
  });
});

