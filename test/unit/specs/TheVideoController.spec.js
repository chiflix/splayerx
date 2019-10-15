import Vuex from 'vuex';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import sinon from 'sinon';
import Window from '@/store/modules/Window';
import Video from '@/store/modules/Video';
import Input from '@/store/modules/Input';
import Playlist from '@/store/modules/Playlist';
import TheVideoController from '@/containers/TheVideoController.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Component - TheVideoController Unit Test', () => {
  let wrapper;
  let sandbox;
  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        Window: {
          state: Window.state,
          mutations: Window.mutations,
        },
        Video: {
          getters: Video.getters,
        },
        Playlist: {
          state: Playlist.state,
          getters: Playlist.getters,
        },
        Input: {
          state: Input.state,
          mutations: Input.mutations,
          actions: Input.actions,
          getters: Input.getters,
        },
      },
    });
    wrapper = shallowMount(TheVideoController, { store, localVue });
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    wrapper.destroy();
    sandbox.restore();
  });

  it('Sanity - should component be properly mounted', () => {
    expect(wrapper.contains(TheVideoController)).to.equal(true);
  });
});
