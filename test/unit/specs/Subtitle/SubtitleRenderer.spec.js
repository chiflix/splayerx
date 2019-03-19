import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Window from '@/store/modules/Window';
import Video from '@/store/modules/Video';
import SubtitleRenderer from '@/components/Subtitle/SubtitleRenderer.vue';

describe('Component - SubtitleRenderer', () => {
  let wrapper;
  const localVue = createLocalVue();
  localVue.use(Vuex);
  const store = new Vuex.Store({
    modules: {
      Window: {
        state: Window.state,
        getters: Window.getters,
      },
      Video: {
        state: Video.state,
        getters: Video.getters,
      },
    },
  });

  beforeEach(() => {
    wrapper = shallowMount(SubtitleRenderer, { store, localVue, attachToDocument: true });
  });

  afterEach(() => {
    wrapper.destroy();
  });

  it('Sanity - should render SubtitleRenderer properly', () => {
    expect(wrapper.contains(SubtitleRenderer)).to.equal(true);
  });
});
