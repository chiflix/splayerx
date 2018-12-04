import Vuex from 'vuex';
import Video from '@/store/modules/Video';
import Subtitle from '@/store/modules/Subtitle';
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

  it('should render correct HTML elements', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });

    expect(wrapper.html()).contains('ul');
    expect(wrapper.html()).contains('li');
    expect(wrapper.html()).contains('div');
  });

  it('toggleItemClick method works fine', () => {
    const wrapper = shallowMount(SubtitleControl, {
      store,
      localVue,
      attachToDocument: true,
    });
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

  it('added-local-subtitles event listener work fine', () => {
    const wrapper = shallowMount(SubtitleControl, { store, localVue });
    wrapper.setData = {
      foundSubtitles: false,
      currentSubIden: -1,
    };
    wrapper.vm.$bus.$emit('added-local-subtitles', 9);
    const stub = sinon.stub(wrapper.vm.$bus, '$on');
    stub('added-local-subtitles');
    expect(wrapper.vm.foundSubtitles).equal(true);
    expect(wrapper.vm.currentSubIden).equal(9);
  });
});
