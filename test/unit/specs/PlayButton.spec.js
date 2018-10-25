import PlayButton from '@/components/PlayingView/PlayButton';
import { mount } from '@vue/test-utils';

describe('PlayButton.vue', () => {
  const propsData = {
    paused: false,
  };
  let wrapper;
  beforeEach(() => {
    wrapper = mount(PlayButton, { propsData });
  });

  it('should changed paused value trigger iconAppear to true', () => {
    wrapper.vm.iconAppear = false;

    wrapper.setProps({ paused: !wrapper.vm.paused });

    expect(wrapper.vm.iconAppear).to.equal(true);
  });

  it('should changed paused change ani_mode', () => {
    wrapper.setProps({ paused: !wrapper.vm.paused });

    expect(wrapper.vm.ani_mode).to.equal(wrapper.vm.paused ? 'icon-ani-pause' : 'icon-ani-play');
  });

  it('should animationend event make iconAppear false', () => {
    wrapper.setData({ iconAppear: true });
    const icon = wrapper.find('.icon');
    icon.trigger('animationend');
    expect(wrapper.vm.iconAppear).equal(false);
  });
});
