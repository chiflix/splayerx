import Vue from 'vue';
import PlayButton from '@/components/PlayingView/PlayButton';
import { mount } from '@vue/test-utils';

describe('PlayButton.vue', () => {
  it('correct data when mounted', () => {
    const wrapper = mount(PlayButton);
    expect(wrapper.vm.iconAppear).equal(false);
    expect(wrapper.vm.ani_mode).equal('');
    expect(wrapper.vm.src).equal('');
  });
  it('methods works fine', () => {
    const wrapper = mount(PlayButton);
    wrapper.setData({ iconAppear: true });
    wrapper.vm.animationEnd();
    expect(wrapper.vm.iconAppear).equal(false);
  });
  it('model an animation end', () => {
    const wrapper = mount(PlayButton);
    wrapper.setData({ iconAppear: true });
    const img = wrapper.find('img');
    img.trigger('animationend');
    expect(wrapper.vm.iconAppear).equal(false);
  });
  it('pause button will appear', () => {
    const wrapper = mount(PlayButton);
    wrapper.vm.iconAppear = true;
    return Vue.nextTick()
      .then(function () {
        expect(wrapper.vm.iconAppear).equal(true);
        expect(wrapper.html()).contains('<img type="image/svg+xml"');
      });
  });
});
