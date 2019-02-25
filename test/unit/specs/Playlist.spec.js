import Playlist from '@/components/LandingView/Playlist.vue';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import sinon from 'sinon';
import Video from '@/store/modules/Video';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Component - Playlist Unit Test', () => {
  let wrapper;
  let sandbox;
  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        Video: {
          getters: Video.getters,
        },
      },
    });
    wrapper = shallowMount(Playlist, { store, localVue });
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    wrapper.destroy();
    sandbox.restore();
  });

  it('correct data when mounted', () => {
    expect(wrapper.vm.showShortcutImage).equal(false);
    expect(wrapper.vm.landingLogoAppear).equal(true);
    expect(wrapper.vm.mouseDown).equal(false);
    expect(wrapper.vm.isDragging).equal(false);
    expect(wrapper.vm.disX).equal('');
    expect(wrapper.vm.disY).equal('');
    expect(wrapper.vm.recentFileDel).equal(false);
  });
  it('open method works fine', () => {
    wrapper.setData({ showingPopupDialog: false });
    wrapper.vm.open();
    expect(wrapper.vm.showingPopupDialog).equal(true);
  });
  it('itemShortcut method works fine', () => {
    const link = 'link';
    wrapper.vm.itemShortcut(link);
    expect(wrapper.vm.itemShortcut(link)).equal(`url("${link}")`);
  });
});
