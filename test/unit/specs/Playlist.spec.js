import Playlist from '@/components/LandingView/Playlist';
import { mount } from '@vue/test-utils';
import sinon from 'sinon';

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
  it('hasRecentPlaylist computed property works fine ', () => {
    const wrapper = mount(Playlist);
    expect(wrapper.vm.hasRecentPlaylist).equal(false);
    wrapper.setProps({ lastPlayedFile: [{ path: 'file:////Users/tanyang/Desktop/test.mp4', chosen: true }] });
    expect(wrapper.vm.hasRecentPlaylist).equal(true);
  });
  it('onRecentItemMouseover method works fine', () => {
    const wrapper = mount(Playlist);
    const spy = sinon.spy(wrapper.vm, 'onRecentItemMouseover');
    wrapper.setComputed({ hasRecentPlaylist: true });
    wrapper.setProps({ lastPlayedFile: [{ path: 'file:////Users/tanyang/Desktop/test.mp4', chosen: true }] });
    wrapper.find('.item').trigger('mouseover');
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });
  it('onRecentItemMouseout method works fine', () => {
    const wrapper = mount(Playlist);
    const spy = sinon.spy(wrapper.vm, 'onRecentItemMouseout');
    wrapper.setComputed({ hasRecentPlaylist: true });
    wrapper.setProps({ lastPlayedFile: [{ path: 'file:////Users/tanyang/Desktop/test.mp4', chosen: true }] });
    wrapper.find('.item').trigger('mouseout');
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });
  it('onRecentItemClick method works fine', () => {
    const wrapper = mount(Playlist);
    const spy = sinon.spy(wrapper.vm, 'onRecentItemClick');
    wrapper.setData({ isDragging: true });
    wrapper.setComputed({ hasRecentPlaylist: true });
    wrapper.setProps({ lastPlayedFile: [{ path: 'file:////Users/tanyang/Desktop/test.mp4', chosen: true }] });
    wrapper.find('.item').trigger('click.stop');
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });
});
