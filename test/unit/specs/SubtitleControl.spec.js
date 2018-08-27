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
    expect(wrapper.vm.showingPopupDialog).equal(false);
    expect(wrapper.vm.preStyle).contains('linear-gradient');
    expect(wrapper.vm.currentSubIden).equal(0);
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

  it('toggleSubtitleBtnMouseover method work fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    const spy = sinon.spy(wrapper.vm.$bus, '$emit');
    wrapper.vm.toggleSubtitleBtnMouseover();
    expect(spy.calledOnce).equal(true);
    expect(spy.args[0][0]).equal('clear-all-widget-disappear-delay');
    spy.restore();
  });

  it('toggleLoadServerSubtitles method work fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    const spy = sinon.spy(wrapper.vm.$bus, '$emit');
    wrapper.vm.toggleLoadServerSubtitles();
    expect(spy.calledOnce).equal(true);
    expect(spy.args[0][0]).equal('load-server-transcripts');
    spy.restore();
  });

  it('toggleOpenFileDialog method work fine if dialog is showing', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData({ showingPopupDialog: true });
    wrapper.vm.toggleOpenFileDialog();
    expect(wrapper.vm.showingPopupDialog).equal(true);
  });

  it('sub-ctrl-hide event listener work fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.vm.$bus.$emit('sub-ctrl-hide');
    const stub1 = sinon.stub(wrapper.vm.$bus, '$on');
    const spy1 = sinon.spy(wrapper.vm, 'subCtrlBtnHide');
    const spy2 = sinon.spy(wrapper.vm.$bus, '$emit');

    stub1.yields();
    stub1('sub-ctrl-hide', spy1, spy2);
    expect(spy1.called).equal(true);
    expect(spy2.called).equal(true);
    expect(spy2.args[0][0]).equal('subtitle-menu-toggled-off');
    stub1.restore();
    spy2.restore();
    spy1.restore();
  });

  it('added-local-subtitles event listener work fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData = {
      foundSubtitles: false,
      currentSubIden: -1,
    }
    wrapper.vm.$bus.$emit('added-local-subtitles', 9);
    const stub = sinon.stub(wrapper.vm.$bus, '$on');
    stub('added-local-subtitles');
    expect(wrapper.vm.foundSubtitles).equal(true);
    expect(wrapper.vm.currentSubIden).equal(9);
  });
});
