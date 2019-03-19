import Vuex from 'vuex';
import Video from '@/store/modules/Video';
import Preference from '@/store/modules/Preference';
import TheTimeCodes from '@/components/PlayingView/TheTimeCodes.vue';
import { mount, createLocalVue } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Component - TheTimeCodes', () => {
  let wrapper;
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

  beforeEach(() => {
    wrapper = mount(TheTimeCodes, { store, localVue });
  });

  afterEach(() => {
    wrapper.destroy();
  });

  it('sanity - should render correct component', () => {
    expect(wrapper.contains(TheTimeCodes)).to.equal(true);
  });
});
