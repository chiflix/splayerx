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
    expect(wrapper.vm.showVolumeController).equal(true);
    expect(wrapper.vm.onVolumeSliderMousedown).equal(false);
    expect(wrapper.vm.currentVolume).equal(0);
    expect(wrapper.vm.timeoutIdOfVolumeControllerDisappearDelay).equal(0);
  });

  it('onVolumeButtonClick method works fine', () => {
    const wrapper = shallowMount(VolumeControl, { store, localVue });
    wrapper.vm.onVolumeButtonClick();
    expect(wrapper.vm.currentVolume).equal(20);
  });

  /* 测试 eventbus中emit和on的写法，需要研究
  it('onVolumeButtonClick method works fine', (done) => {
    const wrapper = shallowMount(VolumeControl, { store, localVue });
    var eventFired = false
    store.state.PlaybackState.Volume = 0.2;
    setTimeout( () => {
      expect(wrapper.emitted('volume')).equal();
      expect(wrapper.emitted('volume')).equal( ? );
      done();
    },1000);
    wrapper.vm.$on('volume',() => {
      eventFired = true
    });
    wrapper.vm.onVolumeButtonClick();
    expect(wrapper.vm.currentVolume).equal(20);
  }); */

  it('appearVolumeSlider method works fine', () => {
    const wrapper = shallowMount(VolumeControl, { store, localVue });
    wrapper.vm.appearVolumeSlider();
    expect(wrapper.vm.showVolumeSlider).equal(true);
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

  it('appearVolumeController method works fine', () => {
    const wrapper = shallowMount(VolumeControl, { store, localVue });
    wrapper.setData({ showVolumeController: false });
    wrapper.vm.appearVolumeController();
    expect(wrapper.vm.showVolumeController).equal(true);
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

  it('$_clearTimeoutDelay method works fine', () => {
    const wrapper = shallowMount(VolumeControl, { store, localVue });
    wrapper.setData({ timeoutIdOfVolumeControllerDisappearDelay: 100 });
    wrapper.vm.$_clearTimeoutDelay();
    expect(wrapper.vm.timeoutIdOfVolumeControllerDisappearDelay).equal(100);
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
