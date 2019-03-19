import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Window from '@/store/modules/Window';
import Video from '@/store/modules/Video';
import SubtitleEditor from '@/components/Subtitle/SubtitleEditor.vue';

describe('Component - SubtitleEditor', () => {
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
    wrapper = shallowMount(SubtitleEditor, { store, localVue, attachToDocument: true });
  });

  afterEach(() => {
    wrapper.destroy();
  });

  it('Sanity - should render SubtitleEditor properly', () => {
    expect(wrapper.contains(SubtitleEditor)).to.equal(true);
  });
});
