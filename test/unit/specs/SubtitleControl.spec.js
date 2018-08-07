import Vuex from 'vuex';
import PlaybackState from '@/store/modules/PlaybackState';
import SubtitleControl from '@/components/PlayingView/SubtitleControl';
import { shallowMount, createLocalVue } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('SubtitleControl.vue', () => {
  const testSubArr = [];
  testSubArr[0] = { title: 'something index 0' };
  testSubArr[1] = { title: 'something index 1' };
  testSubArr[2] = { title: 'something index 2' };

  let store;

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        PlaybackState: {
          state: PlaybackState.state,
          mutations: PlaybackState.mutations,
        },
      },
    });
  });

  it('should load with correct data', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    expect(wrapper.vm.avaliableSuntitlesItems.length).equal(7);
    expect(wrapper.vm.avaliableSuntitlesItems[0].title).equal('Chinese 1');
    expect(wrapper.vm.avaliableSuntitlesItems[6].title).equal('无');
    expect(wrapper.vm.isSubCtrlBtnAppear).equal(true);
    expect(wrapper.vm.itemIsChosen).equal(false);
    expect(wrapper.vm.appearSubtitleMenu).equal(false);
    expect(wrapper.vm.localSubAvaliable).equal(true);
    expect(wrapper.vm.mouseOverDisItem).equal(false);
  });

  it('should render correct HTML elements', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({
      appearSubtitleMenu: true,
      localSubAvaliable: true,
    });
    expect(wrapper.html()).contains('Chinese 1');
    expect(wrapper.html()).contains('无');
  });

  it('subCtrlBtnAppear method works fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({ isSubCtrlBtnAppear: false });
    wrapper.vm.subCtrlBtnAppear();
    expect(wrapper.vm.isSubCtrlBtnAppear).equal(true);
  });

  it('subCtrlBtnHide method works fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({
      isSubCtrlBtnAppear: true,
      appearSubtitleMenu: true,
    });
    wrapper.vm.subCtrlBtnHide();
    expect(wrapper.vm.isSubCtrlBtnAppear).equal(false);
    expect(wrapper.vm.appearSubtitleMenu).equal(false);
  });

  it('toggleSubtitleMenu method works fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({ appearSubtitleMenu: false });
    wrapper.vm.toggleSubtitleMenu();
    expect(wrapper.vm.appearSubtitleMenu).equal(true);
    wrapper.setData({ isBtnMenuAppear: true });
    wrapper.vm.toggleSubtitleMenu();
    expect(wrapper.vm.appearSubtitleMenu).equal(false);
  });

  it('toggleItemsMouseOver method works fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({ itemIsChosen: false });
    wrapper.vm.toggleItemsMouseOver();
    expect(wrapper.vm.itemIsChosen).equal(true);
  });
});
