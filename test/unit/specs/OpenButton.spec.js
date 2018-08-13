import Vue from 'vue';
import Openbutton from '@/components/LandingView/Openbutton';
import { mount } from '@vue/test-utils';

function getIsDragging(Component, propsData) {
  const Constructor = Vue.extend(Component);
  const vmv = new Constructor({ propsData }).$mount();
  return vmv;
}
describe('Openbutton.vue', () => {
  it('correct data when mounted', () => {
    const wrapper = mount(Openbutton);
    expect(wrapper.vm.showingPopupDialog).equal(false);
  });
  it('renders correctly with different props', () => {
    const childvm = getIsDragging(Openbutton, {
      isDragging: true,
    });
    expect(childvm.isDragging).equal(true);
  });
  it('open method works fine', () => {
    const wrapper = mount(Openbutton);
    wrapper.setData({ showingPopupDialog: false });
    wrapper.vm.open('./');
    expect(wrapper.vm.showingPopupDialog).equal(true);
  });
});
