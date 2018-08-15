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
    expect(wrapper.vm.showTimeCode).equal(false);
    expect(wrapper.vm.timeoutIdOftimeCodeDisappearDelay).equal(0);
    expect(wrapper.vm.contentState).equal(0);
    expect(wrapper.vm.ContentStateEnum.DEFAULT).equal(0);
    expect(wrapper.vm.ContentStateEnum.CURRENT_REMAIN).equal(1);
    expect(wrapper.vm.ContentStateEnum.REMAIN_DURATION).equal(2);
    wrapper.destroy();
  });

  it('switchStateOfContent method works fine', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    const clearTimeOutDelaySpy = sinon.spy(wrapper.vm, '$_clearTimeoutDelay');
    wrapper.setData({ contentState: 2 });
    wrapper.vm.switchStateOfContent();
    expect(clearTimeOutDelaySpy.calledOnce).equal(true);
    expect(wrapper.vm.contentState).equal(0);
    clearTimeOutDelaySpy.restore();
    const clearTimeOutDelaySpy1 = sinon.spy(wrapper.vm, '$_clearTimeoutDelay');
    wrapper.setData({ contentState: 4 });
    wrapper.vm.switchStateOfContent();
    expect(clearTimeOutDelaySpy1.calledOnce).equal(true);
    expect(wrapper.vm.contentState).equal(2);
    clearTimeOutDelaySpy1.restore();
    wrapper.destroy();
  });

  it('appearTimeCode method works fine', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    const clearTimeOutDelaySpy = sinon.spy(wrapper.vm, '$_clearTimeoutDelay');
    wrapper.setData({ showTimeCode: false });
    wrapper.vm.appearTimeCode();
    expect(clearTimeOutDelaySpy.calledOnce).equal(true);
    expect(wrapper.vm.showTimeCode).equal(true);
    clearTimeOutDelaySpy.restore();
    wrapper.destroy();
  });

  it('hideTimeCode method works fine', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    wrapper.setData({ showTimeCode: true });
    wrapper.vm.hideTimeCode();
    expect(wrapper.vm.showTimeCode).equal(false);
    wrapper.destroy();
  });

  // 此测试用例是通过sinon spy来模拟emit()方法，测试这个方法是否调用了一个emit方法
  it('clearAllWidgetsTimeout method works fine', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    const globalEventBusEmitSpy = sinon.spy(wrapper.vm.$bus, '$emit');
    wrapper.vm.clearAllWidgetsTimeout();
    expect(globalEventBusEmitSpy.calledOnce).equal(true);
    expect(globalEventBusEmitSpy.firstCall.args[0]).equal('clearAllWidgetDisappearDelay');
    globalEventBusEmitSpy.restore();
    wrapper.destroy();
  });

  it('$_clearTimeoutDelay method works fine', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    const clock = sinon.useFakeTimers();
    sinon.spy(clock, 'clearTimeout');
    wrapper.setData({ timeoutIdOftimeCodeDisappearDelay: 1 });
    wrapper.vm.$_clearTimeoutDelay();
    sinon.assert.calledOnce(clock.clearTimeout);
    sinon.assert.calledWith(clock.clearTimeout, 1);
  });

  it('The global event bus correctly listened to emitted events in created hook', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    wrapper.vm.$bus.$emit('timecode-appear-delay');
    const busOnStub = sinon.stub(wrapper.vm.$bus, '$on');
    busOnStub.yields();
    const spy = sinon.spy(wrapper.vm, 'appearTimeCode');
    busOnStub('timecode-appear-delay', spy);
    expect(spy.calledOnce).equal(true);
    spy.restore();
    busOnStub.restore();
  });

  it('listen to correct events - 2', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    wrapper.vm.$bus.$emit('timecode-appear');
    const stub = sinon.stub(wrapper.vm.$bus, '$on');
    stub.yields();
    const spy = sinon.spy(wrapper.vm, 'appearTimeCode');
    stub('timecode-appear', spy);
    expect(spy.calledOnce).equal(true);
    spy.restore();
    stub.restore();
  });

  it('listen to correct events - 3', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    wrapper.vm.$bus.$emit('timecode-hide');
    const stub = sinon.stub(wrapper.vm.$bus, '$on');
    stub.yields();
    const spy = sinon.spy(wrapper.vm, 'hideTimeCode');
    stub('timecode-hide', spy);
    expect(spy.calledOnce).equal(true);
    spy.restore();
    stub.restore();
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

  // event triggerring correct methods testing
  it('switchStateOfContent method can be triggered by mousedown.stop', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    const spy = sinon.spy(wrapper.vm, 'switchStateOfContent');
    wrapper.find('.timing').trigger('mousedown.stop');
    expect(spy.calledOnce).equal(true);
  });
  it('appearTimeCode method can be triggered by mousedown.stop', () => {
    const wrapper = shallowMount(TheTimeCodes, { store, localVue });
    const spy = sinon.spy(wrapper.vm, 'appearTimeCode');
    wrapper.find('.timing').trigger('mouseover.stop');
    expect(spy.calledOnce).equal(true);
  });
});
