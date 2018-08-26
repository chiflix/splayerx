import Vuex from 'vuex';
import PlaybackState from '@/store/modules/PlaybackState';
import SubtitleControl from '@/components/PlayingView/SubtitleControl';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import sinon from 'sinon';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('SubtitleControl.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        PlaybackState: {
          state: PlaybackState.state,
          getters: PlaybackState.getters,
          mutations: PlaybackState.mutations,
        },
      },
    });
  });

  it('should load with correct data', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    expect(wrapper.vm.loadingSubsPlaceholders.local).equal('');
    expect(wrapper.vm.loadingSubsPlaceholders.embedded).equal('');
    expect(wrapper.vm.loadingSubsPlaceholders.server).equal('');
    expect(wrapper.vm.isSubCtrlBtnAppear).equal(true);
    expect(wrapper.vm.appearSubtitleMenu).equal(false);
  });

  it('should render correct HTML elements', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({
      isSubCtrlBtnAppear: true,
      appearSubtitleMenu: true,
    });
    expect(wrapper.html()).contains('ul');
    expect(wrapper.html()).contains('li');
    expect(wrapper.html()).contains('img');
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

  it('toggleItemClick method works fine', () => {
    const wrapper = shallowMount(SubtitleControl, {
      store,
      localVue,
      attachToDocument: true,
    });
    wrapper.setData({ isSubCtrlBtnAppear: true });
    wrapper.setData({ appearSubtitleMenu: true });
    const spy = sinon.spy(wrapper.vm.$bus, '$emit');
    wrapper.vm.toggleItemClick(1);
    expect(wrapper.vm.currentSubIden).equal(1);
    expect(spy.calledOnce).equal(true);
    expect(spy.firstCall.args[0]).equal('sub-first-change');
    expect(spy.firstCall.args[1]).equal(1);
    spy.restore();
  });

  it('toggleSubtitleOff method works fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({ isSubCtrlBtnAppear: true });
    wrapper.setData({ appearSubtitleMenu: true });
    const spy = sinon.spy(wrapper.vm.$bus, '$emit');
    wrapper.vm.toggleSubtitleOff();
    expect(wrapper.vm.currentSubIden).equal(-1);
    expect(spy.calledOnce).equal(true);
    expect(spy.firstCall.args.length).equal(1);
    expect(spy.firstCall.args[0]).equal('first-subtitle-off');
    spy.restore();
  });

  it('itemHasBeenChosen method works fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({
      isSubCtrlBtnAppear: true,
      appearSubtitleMenu: true,
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

  it('computedAvaliableItems computed property works fine', () => {
    const testSubArr = [
      { title: 'something index 0' },
      { title: 'something index 1' },
      { title: 'something index 2' },
      { title: 'something index 3' },
    ];
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    store.commit('SubtitleNameArr', testSubArr);
    expect(wrapper.vm.computedAvaliableItems.length).equal(4);
    expect(wrapper.vm.computedAvaliableItems[2].title).equal('something index 2');
  });
});
