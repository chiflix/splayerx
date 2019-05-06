import Vuex from 'vuex';
import { createSandbox } from 'sinon';
import PlayButton from '@/components/PlayingView/PlayButton.vue';
import Editor from '@/store/modules/Editor';
import { shallowMount, createLocalVue } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('PlayButton.vue', () => {
  let store;
  const propsData = {
    paused: false,
  };
  const baseStore = {
    modules: {
      Editor: {
        state: Editor.state,
        getters: Editor.getters,
        mutations: Editor.mutations,
      },
    },
  };
  let wrapper;
  let sandbox = createSandbox();

  beforeEach(() => {
    sandbox = createSandbox();
    store = new Vuex.Store(baseStore);
    wrapper = shallowMount(PlayButton, { localVue, store, propsData });
  });

  afterEach(() => {
    wrapper.destroy();
    sandbox.restore();
  });

  it('should changed paused value trigger iconAppear to false', () => {
    wrapper.vm.iconAppear = false;

    wrapper.setProps({ paused: !wrapper.vm.paused });

    expect(wrapper.vm.iconAppear).to.equal(false);
  });
});
