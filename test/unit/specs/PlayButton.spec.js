import { mount } from '@vue/test-utils';
import PlayButton from '@/components/PlayingView/PlayButton.vue';

describe('PlayButton.vue', () => {
  const propsData = {
    paused: false,
  };
  let wrapper;
  beforeEach(() => {
    wrapper = mount(PlayButton, { propsData });
  });

  it('should changed paused value trigger iconAppear to false', () => {
    wrapper.vm.iconAppear = false;

    wrapper.setProps({ paused: !wrapper.vm.paused });

    expect(wrapper.vm.iconAppear).to.equal(false);
  });
});
