import Vuex from 'vuex';
import Video from '@/store/modules/Video';
import TheTimeCodes from '@/components/PlayingView/TheTimeCodes';
import { mount, createLocalVue } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Component - TheTimeCodes', () => {
  let wrapper;
  const store = new Vuex.Store({
    modules: {
      Video: {
        state: Video.state,
        mutations: Video.mutations,
        getters: Video.getters,
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

  describe('Methods', () => {
    it('should switchStateOfContent adjust contentState correctly', () => {
      const states = [0, 1, 2, 3, 4, 5];
      states.forEach((state) => {
        wrapper.setData({ contentState: state });

        wrapper.vm.switchStateOfContent();

        expect(wrapper.vm.contentState).to.equal((state + 1) % 3);
      });
    });
  });
});
