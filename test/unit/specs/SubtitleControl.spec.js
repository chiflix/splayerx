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
    expect(wrapper.vm.isBtnMenuAppear).equal(false);
    expect(wrapper.vm.isSubCtrlBtnAppear).equal(false);
    expect(wrapper.vm.barBottom).equal(6);
    expect(wrapper.vm.timeoutIdOfSubCtrlDisappearDelay).equal(0);
  });

  it('should render correct HTML elements', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({
      isSubCtrlBtnAppear: true,
      isBtnMenuAppear: true,
    });
    expect(wrapper.html()).contains('alt="On"');
    expect(wrapper.html()).contains('alt="Off"');
  });

  it('subCtrlAppear method works fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({ isSubCtrlBtnAppear: false });
    wrapper.vm.subCtrlAppear();
    expect(wrapper.vm.isSubCtrlBtnAppear).equal(true);
  });

  it('subCtrlHide method works fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({
      isSubCtrlBtnAppear: true,
      isBtnMenuAppear: true,
    });
    wrapper.vm.subCtrlHide();
    expect(wrapper.vm.isSubCtrlBtnAppear).equal(false);
    expect(wrapper.vm.isBtnMenuAppear).equal(false);
  });

  it('toggleButtonMenu method works fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({ isBtnMenuAppear: false });
    wrapper.vm.toggleButtonMenu();
    expect(wrapper.vm.isBtnMenuAppear).equal(true);
    wrapper.setData({ isBtnMenuAppear: true });
    wrapper.vm.toggleButtonMenu();
    expect(wrapper.vm.isBtnMenuAppear).equal(false);
  });

  it('subtitleNameArr computed property works fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    store.state.PlaybackState.SubtitleNameArr = testSubArr;
    expect(wrapper.vm.subtitleNameArr).equal(testSubArr);
  });
  // 测试 eventbus emit and on - 待
});
