import Vue from 'vue';
import messages from '@/locales';
import UpdaterNotification from '@/components/UpdaterView/UpdaterNotification';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueI18n from 'vue-i18n';
import { ipcMain, ipcRenderer } from './ipcMock.js';
import { RendererHelperForMac } from '../../../../src/main/update/RendererHelper.js';
import MainHelper from './mainSimulator.js';
let mainHelper;
Vue.use(VueI18n);
const $i18n = new VueI18n({
  locale: 'en', // set locale
  messages, // set locale messages
});
const localView = createLocalVue();
localView.use(VueI18n);
const options = {
  localView,
  i18n: $i18n,
};
let wrapper;
const updateInfo = { version: '0.5.1', note: 'hello' };

describe('UpdaterNotification.vue', () => {
  beforeEach(() => {
    ipcMain.removeAllListener();
    ipcRenderer.removeAllListener();
    wrapper = shallowMount(UpdaterNotification, options);
    wrapper.vm.helper = new RendererHelperForMac(wrapper.vm);
    wrapper.vm.helper.ipc = ipcRenderer;
    mainHelper = MainHelper('darwin', ipcMain);
    wrapper.vm.helper.rendererReady(); // means render Ready
    wrapper.vm.helper.registerListener();
  });
  it('loaded correct', () => {
    expect(wrapper.vm.helper).not.equal(null);
    expect(wrapper.vm.content).equal('');
    expect(wrapper.vm.buttons).eql([]);
    expect(wrapper.vm.linkProp['webkit-animation-name']).equal(null);
  });
  it('test for mac when can install update', (done) => {
    mainHelper.onUpdateDownloaded(updateInfo);
    expect(wrapper.vm.helper).not.equal(null);
    setTimeout(() => {
      expect(wrapper.vm.position.right).equal('');
      done();
    }, 500);
  });
  it('test for mac when installed update last round', (done) => {
    expect(wrapper.vm.helper).not.equal(null);
    mainHelper.onStart();
    setTimeout(() => {
      expect(wrapper.vm.position.right).not.equal('');
      done();
    }, 500);
  });
});
