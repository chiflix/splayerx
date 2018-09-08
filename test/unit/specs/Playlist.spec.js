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
    expect(wrapper.vm.showingPopupDialog).equal(false);
    expect(wrapper.vm.move).equal(0);
    expect(wrapper.vm.moveItem).equal(0);
  });
  it('showItemNum watcher works fine', () => {
    const wrapper = mount(Playlist);
    wrapper.setProps({ showItemNum: 5 });
    wrapper.setProps({ showItemNum: 10 });
    expect(wrapper.vm.move).equal(0);
    wrapper.setData({ moveItem: -2 });
    wrapper.setProps({ showItemNum: -1 });
    wrapper.setProps({ showItemNum: 0 });
    expect(wrapper.vm.moveItem).equal(-1);
  });
  it('windowWidth watcher works fine', () => {
    const wrapper = mount(Playlist, {
      attachToDocument: true,
    });
    wrapper.setProps({ changeSize: 100 });
    wrapper.setProps({ windowWidth: 720 });
    wrapper.setProps({ windowWidth: 1355 });
    expect(wrapper.vm.itemWidth).equal(1355);
  });
  it('open method works fine', () => {
    const wrapper = mount(Playlist);
    wrapper.setData({ showingPopupDialog: false });
    wrapper.vm.open('');
    expect(wrapper.vm.showingPopupDialog).equal(true);
    wrapper.vm.open('');
  });
  it('openOrMove method works fine', () => {
    const wrapper = mount(Playlist, {
      attachToDocument: true,
    });
    wrapper.setData({ showingPopupDialog: false });
    wrapper.setData({ moveItem: 0 });
    wrapper.find('.button').trigger('click');
    expect(wrapper.vm.showingPopupDialog).equal(true);
    wrapper.setData({ moveItem: -1 });
    wrapper.vm.openOrMove();
    expect(wrapper.vm.moveItem).equal(0);
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
  it('onRecentItemMouseover method works fine', () => {
    const wrapper = mount(Playlist, {
      attachToDocument: true,
    });
    const spy = sinon.spy(wrapper.vm, 'onRecentItemMouseover');
    wrapper.setProps({ isFullScreen: true });
    wrapper.setProps({ lastPlayedFile: [{ path: 'file:////Users/tanyang/Desktop/test.mp4' }] });
    wrapper.find('.item').trigger('mouseover');
    wrapper.setData({ isTurnToOdd: true });
    wrapper.find('.item').trigger('mouseover');
    wrapper.setProps({ lastPlayedFile: [{ path: 'file:////Users/tanyang/Desktop/test.mp4', shortCut: '' }] });
    wrapper.find('.item').trigger('mouseover');
    expect(spy.calledThrice).equal(true);
    spy.restore();
  });
  it('onRecentItemMouseout method works fine', () => {
    const wrapper = mount(Playlist);
    const spy = sinon.spy(wrapper.vm, 'onRecentItemMouseout');
    wrapper.setProps({ lastPlayedFile: [{ path: 'file:////Users/tanyang/Desktop/test.mp4' }] });
    wrapper.find('.item').trigger('mouseout');
    expect(spy.calledOnce).equal(true);
    spy.restore();
  });
  it('onRecentItemClick method works fine', () => {
    const wrapper = mount(Playlist, {
      attachToDocument: true,
    });
    wrapper.setData({
      isDragging: false, moveItem: 0,
    });
    wrapper.setProps({
      isFullScreen: false, showItemNum: 5,
    });
    const item = { path: 'file:////Users/tanyang/Desktop/test.mp4' };
    const moveitem = wrapper.vm.moveItem;
    wrapper.vm.onRecentItemClick(item, 4);
    expect(wrapper.vm.moveItem).equal(moveitem - 1);
    wrapper.setData({ moveItem: -4 });
    wrapper.vm.onRecentItemClick(item, 2);
    expect(wrapper.vm.moveItem).equal(-3);
  });
  it('onRecentItemMousedown method works fine', () => {
    const wrapper = mount(Playlist, {
      attachToDocument: true,
    });
    wrapper.setData({
      moveItem: -1, isDragging: true, mouseDown: true,
    });
    wrapper.setProps({ showItemNum: 7 });
    wrapper.setProps({ lastPlayedFile: [{ path: 'file:////Users/tanyang/Desktop/test.mp4' }] });
    const e = new window.Event('mousedown');
    wrapper.vm.onRecentItemMousedown(e, 0);
    expect(wrapper.vm.isDragging).equal(false);
    wrapper.find('.item').trigger('mousemove');
    expect(wrapper.vm.recentFileDel).equal(false);
    wrapper.find('.item').trigger('mouseup');
    wrapper.setData({ recentFileDel: true });
    wrapper.find('.item').trigger('mouseup');
    expect(wrapper.vm.mouseDown).equal(false);
  });
  it('onkeypress works fine', () => {
    const wrapper = mount(Playlist, {
      attachToDocument: true,
    });
    wrapper.setProps({ showItemNum: 1, isFullScreen: false });
    wrapper.setProps({ lastPlayedFile: [{ path: 'file:////Users/tanyang/Desktop/test.mp4' }] });
    wrapper.setData({ moveItem: 0 });
    const e = new window.Event('keyup');
    e.keyCode = 39;
    window.onkeyup(e);
    expect(wrapper.vm.moveItem).equal(-1);
    wrapper.setData({ moveItem: -2 });
    e.keyCode = 37;
    window.onkeyup(e);
    expect(wrapper.vm.moveItem).equal(-1);
    window.onkeyup(e);
    expect(wrapper.vm.moveItem).equal(0);
  });
});
