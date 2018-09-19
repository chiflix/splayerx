import Vuex from 'vuex';
import PlaybackState from '@/store/modules/PlaybackState';
import TheTimeCodes from '@/components/PlayingView/TheTimeCodes';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import sinon from 'sinon';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('TheTimeCodes.vue', () => {
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

  afterEach(() => {
    sinon.restore();
  });

  it('should load correct data', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    expect(wrapper.vm.contentState).equal(0);
    expect(wrapper.vm.ContentStateEnum.DEFAULT).equal(0);
    expect(wrapper.vm.ContentStateEnum.CURRENT_REMAIN).equal(1);
    expect(wrapper.vm.ContentStateEnum.REMAIN_DURATION).equal(2);
    wrapper.destroy();
  });

  it('switchStateOfContent method works fine', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    wrapper.setData({ contentState: 2 });
    wrapper.vm.switchStateOfContent();
    expect(wrapper.vm.contentState).equal(0);
    wrapper.setData({ contentState: 4 });
    wrapper.vm.switchStateOfContent();
    expect(wrapper.vm.contentState).equal(2);
    wrapper.destroy();
  });

  it('has correct computed property - hasDuration', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    store.state.PlaybackState.Duration = NaN;
    expect(wrapper.vm.hasDuration).equal(false);
    store.state.PlaybackState.Duration = 1;
    expect(wrapper.vm.hasDuration).equal(true);
  });

  it('has correct computed property - isRemainTime', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    wrapper.setData({ contentState: 0 }); // other is 2, 1
    expect(wrapper.vm.isRemainTime.first).equal(false);
    expect(wrapper.vm.isRemainTime.second).equal(false);
    wrapper.setData({ contentState: 1 }); // other is 1, 2
    expect(wrapper.vm.isRemainTime.first).equal(false);
    expect(wrapper.vm.isRemainTime.second).equal(true);
    wrapper.setData({ contentState: 2 }); // other is 1, 2
    expect(wrapper.vm.isRemainTime.first).equal(true);
    expect(wrapper.vm.isRemainTime.second).equal(false);
  });

  it('has correct computed property - duration', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    store.state.PlaybackState.Duration = 3000;
    expect(wrapper.vm.duration).equal('50:00');
  });

  it('has correct computed property - currentTime', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    store.state.PlaybackState.CurrentTime = 1500;
    expect(wrapper.vm.currentTime).equal('25:00');
  });

  it('has correct computed property - remainTime', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    store.state.PlaybackState.Duration = 3245;
    store.state.PlaybackState.CurrentTime = 1799; // 3245 - 1799 = 1446
    expect(wrapper.vm.remainTime).equal('24:06');
  });

  it('has correct computed property - content', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    store.state.PlaybackState.Duration = 3000;
    store.state.PlaybackState.CurrentTime = 1500;
    wrapper.setData({ contentState: 0 });
    expect(wrapper.vm.content.first).equal(wrapper.vm.currentTime);
    expect(wrapper.vm.content.second).equal(wrapper.vm.duration);
    wrapper.setData({ contentState: 1 });
    expect(wrapper.vm.content.first).equal(wrapper.vm.currentTime);
    expect(wrapper.vm.content.second).equal(wrapper.vm.remainTime);
    wrapper.setData({ contentState: 2 });
    expect(wrapper.vm.content.first).equal(wrapper.vm.remainTime);
    expect(wrapper.vm.content.second).equal(wrapper.vm.duration);
  });
});
