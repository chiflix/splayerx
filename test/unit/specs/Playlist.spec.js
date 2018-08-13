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
  });
  it('backgroundUrl method works fine', () => {
    const wrapper = mount(Playlist);
    wrapper.setData({ backgroundUrlOdd: 'www.link.com' });
    wrapper.setData({ imageTurn: 'odd' });
    expect(wrapper.vm.backgroundUrl()).equal(wrapper.vm.backgroundUrlOdd);
  });
  it('itemShortcut method works fine', () => {
    const wrapper = mount(Playlist);
    const link = 'link';
    wrapper.vm.itemShortcut(link);
    expect(wrapper.vm.itemShortcut(link)).equal(`url("${link}")`);
  });
  it('hasRecentPlaylist computed property works fine ', () => {
    const wrapper = mount(Playlist);
    expect(wrapper.vm.hasRecentPlaylist).equal(wrapper.vm.lastPlayedFile.length > 0);
  });
});
