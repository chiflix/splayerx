import PlayingView from '@/components/PlayingView.vue';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'Vuex';
import PlaybackState from '@/store/modules/PlaybackState';

const localVue = createLocalVue();

localVue.use(Vuex);

describe('PlayingView.vue', () => {
  let store;

  beforeEach(() => {
    // state = PlaybackState.state;
    store = new Vuex.Store({
      modules: {
        PlaybackState: {
          state: PlaybackState.state,
          getters: PlaybackState.getters,
        },
      },
    });
  });
  it('correct data when mounted', () => {
    const wrapper = shallowMount(PlayingView, ({ store, localVue}));
    expect(wrapper.vm.leave).equal(false);
    expect(wrapper.vm.isDragging).equal(false);
    expect(wrapper.vm.showMask).equal(false);
    expect(wrapper.vm.cursorShow).equal(true);
    expect(wrapper.vm.popupShow).equal(false);
    expect(wrapper.vm.mouseDown).equal(false);
    expect(wrapper.vm.timeoutIdOfAllWidgetsDisappearDelay).equal(0);
    expect(wrapper.vm.delay).equal(200);
    expect(wrapper.vm.clicks).equal(0);
  });
});
