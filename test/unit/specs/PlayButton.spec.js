import PlayButton from '@/components/PlayingView/PlayButton.vue';
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
});
