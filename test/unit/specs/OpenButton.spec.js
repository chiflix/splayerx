import Openbutton from '@/components/LandingView/Openbutton';
import { mount } from '@vue/test-utils';

describe('Openbutton.vue', () => {
  it('correct data when mounted', () => {
    const wrapper = mount(Openbutton);
    expect(wrapper.vm.showingPopupDialog).equal(false);
  });
  it('renders correctly with different props', () => {
    const wrapper = mount(Openbutton);
    wrapper.setProps({ isDragging: true });
    expect(wrapper.vm.isDragging).equal(true);
  });
  it('open method works fine', () => {
    const wrapper = mount(Openbutton);
    wrapper.setData({ showingPopupDialog: false });
    wrapper.vm.open('');
    expect(wrapper.vm.showingPopupDialog).equal(true);
  });
});
