import Vuex from 'vuex';
import PlaybackState from '@/store/modules/PlaybackState';
import VolumeControl from '@/components/PlayingView/VolumeControl';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import sinon from 'sinon';

// 这两行是必须的 for testing with Vuex
const localVue = createLocalVue();
localVue.use(Vuex);

// 待完善的 test
describe('VolumnColtrol.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        PlaybackState: {
          state: PlaybackState.state,
          getters: PlaybackState.getters,
        },
      },
    });
  });

  it('correct data', () => {
    const wrapper = shallowMount(VolumeControl, { store, localVue });
    expect(wrapper.vm.showVolumeSlider).equal(false);
    expect(wrapper.vm.onVolumeSliderMousedown).equal(false);
    expect(wrapper.vm.currentVolume).equal(0);
    expect(wrapper.vm.timeoutIdOfVolumeControllerDisappearDelay).equal(0);
  });

  it('onVolumeButtonClick method works fine', () => {
    const wrapper = shallowMount(VolumeControl, { store, localVue });

    store.state.PlaybackState.Volume = 0.2;
    const emitSpy = sinon.spy(wrapper.vm.$bus, '$emit');

    wrapper.vm.onVolumeButtonClick();
    expect(wrapper.vm.currentVolume).equal(20);
    expect(emitSpy.withArgs('volume', 0).calledOnce).equal(true);
    emitSpy.restore();
  });

  it('onVolumeButtonClick method works fine when volume is 0', () => {
    const wrapper = shallowMount(VolumeControl, { store, localVue });

    store.state.PlaybackState.Volume = 0;
    wrapper.vm.currentVolume = 10;
    const emitSpy = sinon.spy(wrapper.vm.$bus, '$emit');

    wrapper.vm.onVolumeButtonClick();
    expect(emitSpy.withArgs('volume', 0.1).calledOnce).equal(true);
    emitSpy.restore();
  });

  it('onVolumeSliderClick method work fine', () => {
    const wrapper = shallowMount(VolumeControl, { store, localVue });
    const emitSpy = sinon.spy(wrapper.vm.$bus, '$emit');
    const dragClearSpy = sinon.spy(wrapper.vm, '$_documentVoluemeDragClear');
    const dragEventSpy = sinon.spy(wrapper.vm, '$_documentVolumeSliderDragEvent');
    const e = { clientY: 0 };

    wrapper.vm.onVolumeSliderClick(e);
    expect(wrapper.vm.onVolumeSliderMousedown).equal(true);
    expect(emitSpy.withArgs('volume').calledOnce).equal(true);
    expect(dragClearSpy.called).equal(true);
    expect(dragEventSpy.called).equal(true);
    emitSpy.restore();
    dragEventSpy.restore();
    dragClearSpy.restore();
  });

  it('hideVolumeSlider method works fine', () => {
    const wrapper = shallowMount(VolumeControl, { store, localVue });
    wrapper.setData({ onVolumeSliderMousedown: false });
    wrapper.vm.hideVolumeSlider();
    expect(wrapper.vm.showVolumeSlider).not.equal(true);
    wrapper.setData({ onVolumeSliderMousedown: true });
    wrapper.setData({ showVolumeSlider: true });
    wrapper.vm.hideVolumeSlider();
    expect(wrapper.vm.showVolumeSlider).equal(true);
  });

  it('hideVolumeController method works fine', () => {
    const wrapper = shallowMount(VolumeControl, { store, localVue });
    wrapper.setData({
      showVolumeController: true,
      onVolumeSliderMousedown: false,
      showVolumeSlider: true,
    });
    wrapper.vm.hideVolumeController();
    expect(wrapper.vm.showVolumeController).not.equal(true);
    expect(wrapper.vm.showVolumeSlider).not.equal(true);
  });

  it('onVolumeSliderClick method works fine', () => {
    const wrapper = shallowMount(VolumeControl, { store, localVue });
    const onVolumeSliderClickStub = sinon.stub();
    wrapper.setMethods({ onVolumeSliderClick: onVolumeSliderClickStub });
    wrapper.setData({ showVolumeSlider: true });
    wrapper.find('.container').trigger('click');
    expect(onVolumeSliderClickStub.called).equal(false);
  });

  it('$_documentVoluemeDragClear method works fine', () => {
    const wrapper = shallowMount(VolumeControl, { store, localVue });
    wrapper.find('div').trigger('mouseup');
    wrapper.vm.$_documentVoluemeDragClear();
    expect(wrapper.vm.onVolumeSliderMousedown).not.equal(true);
  });
});
