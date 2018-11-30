import Vuex from 'vuex';
import Video from '@/store/modules/Video';
import Subtitle from '@/store/modules/Subtitle';
import SubtitleControl from '@/components/PlayingView/SubtitleControl';
import { shallowMount, createLocalVue } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('SubtitleControl.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        Video: {
          state: Video.state,
          getters: Video.getters,
          mutations: Video.mutations,
        },
        Subtitle: {
          state: Subtitle.state,
          mutations: Subtitle.mutations,
          getters: Subtitle.getters,
        },
      },
    });
  });


  it('itemHasBeenChosen method works fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({
      currentSubIden: 0,
    });
    expect(wrapper.vm.itemHasBeenChosen()).equal(true);
    wrapper.setData({ currentSubIden: 1 });
    expect(wrapper.vm.itemHasBeenChosen(2)).equal(false);
  });

  it('itemTitleHasChineseChar method works fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    expect(wrapper.vm.itemTitleHasChineseChar('你好')).equal(true);
    expect(wrapper.vm.itemTitleHasChineseChar('世界')).equal(true);
    expect(wrapper.vm.itemTitleHasChineseChar('Hello')).equal(false);
    expect(wrapper.vm.itemTitleHasChineseChar('123')).equal(false);
    expect(wrapper.vm.itemTitleHasChineseChar('旰')).equal(true);
  });


  it('toggleOpenFileDialog method work fine if dialog is showing', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({ showingPopupDialog: true });
    wrapper.vm.toggleOpenFileDialog();
    expect(wrapper.vm.showingPopupDialog).equal(true);
  });
});
