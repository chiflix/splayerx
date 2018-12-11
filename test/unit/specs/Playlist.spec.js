import Playlist from '@/components/LandingView/Playlist';
import { mount } from '@vue/test-utils';

describe('Playlist.vue', () => {
  it('correct data when mounted', () => {
    const wrapper = mount(Playlist);
    expect(wrapper.vm.imageTurn).equal('');
    expect(wrapper.vm.isTurnToOdd).equal(false);
    expect(wrapper.vm.backgroundUrlOdd).equal('');
    expect(wrapper.vm.backgroundUrlEven).equal('');
    expect(wrapper.vm.showShortcutImage).equal(false);
    expect(wrapper.vm.langdingLogoAppear).equal(true);
    expect(wrapper.vm.mouseDown).equal(false);
    expect(wrapper.vm.isDragging).equal(false);
    expect(wrapper.vm.disX).equal('');
    expect(wrapper.vm.disY).equal('');
    expect(wrapper.vm.recentFileDel).equal(false);
    expect(wrapper.vm.showingPopupDialog).equal(false);
  });
  it('open method works fine', () => {
    const wrapper = mount(Playlist);
    wrapper.setData({ showingPopupDialog: false });
    wrapper.vm.open('');
    expect(wrapper.vm.showingPopupDialog).equal(true);
    wrapper.vm.open('');
  });
  it('backgroundUrl method works fine', () => {
    const wrapper = mount(Playlist);
    expect(wrapper.vm.backgroundUrl()).equal('');
    wrapper.setData({ backgroundUrlOdd: 'www.link1.com' });
    wrapper.setData({ backgroundUrlEven: 'www.link2.com' });
    wrapper.setData({ imageTurn: 'odd' });
    expect(wrapper.vm.backgroundUrl()).equal(wrapper.vm.backgroundUrlOdd);
    wrapper.setData({ imageTurn: 'even' });
    expect(wrapper.vm.backgroundUrl()).equal(wrapper.vm.backgroundUrlEven);
  });
  it('itemShortcut method works fine', () => {
    const wrapper = mount(Playlist);
    const link = 'link';
    wrapper.vm.itemShortcut(link);
    expect(wrapper.vm.itemShortcut(link)).equal(`url("${link}")`);
  });
});
