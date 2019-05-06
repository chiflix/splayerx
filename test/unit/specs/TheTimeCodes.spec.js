import Vuex from 'vuex';
import { createSandbox } from 'sinon';
import Video from '@/store/modules/Video';
import Editor from '@/store/modules/Editor';
import Preference from '@/store/modules/Preference';
import TheTimeCodes from '@/components/PlayingView/TheTimeCodes.vue';
import { shallowMount, createLocalVue } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Component - TheTimeCodes', () => {
  const store = new Vuex.Store({
    modules: {
      Video: {
        getters: Video.getters,
      },
      Preference: {
        getters: Preference.getters,
      },
    },
  });
  let wrapper;
  let sandbox = createSandbox();

  beforeEach(() => {
    sandbox = createSandbox();
    wrapper = shallowMount(TheTimeCodes, { store, localVue });
  });

  afterEach(() => {
    wrapper.destroy();
    sandbox.restore();
  });

  it('sanity - should render correct component', () => {
    expect(wrapper.contains(TheTimeCodes)).to.equal(true);
  });
});
