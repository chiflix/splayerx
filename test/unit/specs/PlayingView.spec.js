import PlayingView from '@/components/PlayingView.vue';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'Vuex';
import PlaybackState from '@/store/modules/PlaybackState';
import sinon from 'sinon';

const localVue = createLocalVue();

localVue.use(Vuex);

describe('PlayingView.vue', () => {
  let store;

  beforeEach(() => {
    // state = PlaybackState.state;
    store = new Vuex.Store({
      modules: {
        PlaybackState: {
          state: PlaybackState.state,
          getters: PlaybackState.getters,
        },
      },
    });
  });
  it('correct data when mounted', () => {
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    expect(wrapper.vm.leave).equal(false);
    expect(wrapper.vm.isDragging).equal(false);
    expect(wrapper.vm.showMask).equal(false);
    expect(wrapper.vm.cursorShow).equal(true);
    expect(wrapper.vm.popupShow).equal(false);
    expect(wrapper.vm.mouseDown).equal(false);
    expect(wrapper.vm.timeoutIdOfAllWidgetsDisappearDelay).equal(0);
    expect(wrapper.vm.delay).equal(200);
    expect(wrapper.vm.clicks).equal(0);
  });
  // 待完善
  it('mouseleave event trigger', () => {
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    wrapper.find('.video-controller').trigger('mouseleave');
    expect(wrapper.vm.leave).to.be.true;
  });
  it('hideAllWidgets method works fine', () => {
    const wrapper = shallowMount(PlayingView, ({ store, localVue }));
    const globalEventBusEmitSpy = sinon.spy(wrapper.vm.$bus, '$emit');
    wrapper.vm.hideAllWidgets();

    // whether event bus work fine
    expect(globalEventBusEmitSpy.callCount).equal(6);
    expect(globalEventBusEmitSpy.calledWith('volumecontroller-hide')).to.be.true;
    expect(globalEventBusEmitSpy.calledWith('progressbar-hide')).to.be.true;
    expect(globalEventBusEmitSpy.calledWith('timecode-hide')).to.be.true;
    expect(globalEventBusEmitSpy.calledWith('sub-ctrl-hide')).to.be.true;
    expect(globalEventBusEmitSpy.calledWith('titlebar-hide')).to.be.true;

    expect(wrapper.vm.cursorShow).to.be.false;
    globalEventBusEmitSpy.restore();
  });
});
