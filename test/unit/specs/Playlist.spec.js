import Playlist from '@/components/LandingView/Playlist.vue';
import { mount } from '@vue/test-utils';

describe('Playlist.vue', () => {
  it('correct data when mounted', () => {
    const wrapper = mount(Playlist);
    expect(wrapper.vm.showShortcutImage).equal(false);
    expect(wrapper.vm.landingLogoAppear).equal(true);
    expect(wrapper.vm.mouseDown).equal(false);
    expect(wrapper.vm.isDragging).equal(false);
    expect(wrapper.vm.disX).equal('');
    expect(wrapper.vm.disY).equal('');
    expect(wrapper.vm.recentFileDel).equal(false);
  });
  it('open method works fine', () => {
    const wrapper = mount(Playlist);
    wrapper.setData({ showingPopupDialog: false });
    wrapper.vm.open('');
    expect(wrapper.vm.showingPopupDialog).equal(true);
    wrapper.vm.open('');
  });
});
