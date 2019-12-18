import Vue from 'vue';
import { mount, createLocalVue } from '@vue/test-utils';
import VueI18n from 'vue-i18n';
import messages from '@/locales';
import UpdaterNotification from '@/components/UpdaterView/UpdaterNotification.vue';
import ipcs from './ipcMock';
import { RendererHelperForMac } from '../../../../src/main/update/RendererHelper';
import MainHelper from './mainSimulator';
import Storage from '../../../../src/main/update/Updatestorage';

const storage = new Storage();
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
storage.clearPreviousDownload();
storage.clearUpdateInstalled();
describe('UpdaterNotification.vue', () => {
  beforeEach(() => {
    const ipcMr = ipcs();
    wrapper = mount(UpdaterNotification, options);
    wrapper.vm.helper = new RendererHelperForMac(wrapper.vm);
    wrapper.vm.helper.ipc = ipcMr.ipcRenderer;
    mainHelper = MainHelper('darwin', ipcMr.ipcMain);
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
    mainHelper.onUpdateDownloaded(updateInfo).then(() => {
      setTimeout(() => {
        expect(wrapper.vm.helper).not.equal(null);
        expect(wrapper.vm.containerStyle.platform).equal('');
        done();
      }, 300);
    });
  });
  // it('test for mac when installed update last round', (done) => {
  //   expect(wrapper.vm.helper).not.equal(null);
  //   mainHelper.onStart();
  //   setTimeout(() => {
  //     expect(wrapper.vm.containerStyle.platform).equal('darwin');
  //     done();
  //   }, 300);
  // });
});
