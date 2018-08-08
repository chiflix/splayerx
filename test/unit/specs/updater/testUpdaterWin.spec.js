import Vue from 'vue';
import messages from '@/locales';
import UpdaterNotification from '@/components/UpdaterView/UpdaterNotification';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueI18n from 'vue-i18n';
import { ipcMain, ipcRenderer } from './ipcMock.js';
import { RendererHelperForWin } from '../../../../src/main/update/RendererHelper.js';
import MainHelper from './mainSimulator.js';
import Storage from '../../../../src/main/update/Updatestorage.js';
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
const updateInfo = { version: '0.5.1', note: 'hello' };
const updateInfoNext = { version: '0.5.1', note: 'hello' };
let wrapper;
describe('UpdaterNotification.vue', (done) => {
  beforeEach(() => {
    ipcMain.removeAllListener();
    wrapper = shallowMount(UpdaterNotification, options);
    wrapper.vm.helper = new RendererHelperForWin(wrapper.vm);
    wrapper.vm.helper.ipc = ipcRenderer;
    mainHelper = MainHelper('win32', ipcMain);
    wrapper.vm.helper.rendererReady(); // means render Ready
    wrapper.vm.helper.registerListener();
  });
  it('loaded correct', () => {
    expect(wrapper.vm.helper).not.equal(null);
    expect(wrapper.vm.content).equal('');
    expect(wrapper.vm.buttons).eql([]);
    expect(wrapper.vm.linkProp['webkit-animation-name']).equal(null);
  });
  it('test for win downloaded update for the first use', () => {
    storage.clearPreviousDownload()
      .then(() => mainHelper.onUpdateDownloaded(updateInfoNext)).then(() => {
        setTimeout(() => {
          expect(wrapper.vm.helper).not.equal(null);
          expect(wrapper.vm.position.left).equal('');
          done();
        }, 100);
      });
  });
  it('test for win when can install after first use update and user choose to install', () => {
    mainHelper.onUpdateDownloaded(updateInfo).then(() => {
      setTimeout(() => {
        expect(wrapper.vm.helper).not.equal(null);
        expect(wrapper.vm.visibility).not.equal('hidden');
        expect(wrapper.vm.position.left).not.equal('');
        wrapper.vm.helper.install();
        done();
      }, 100);
    });
  });
  // this one must is after previous test to have installed info in storage
  it('test for win has previous installed update', () => {
    mainHelper.onStart();
    setTimeout(() => {
      expect(wrapper.vm.helper).not.equal(null);
      expect(wrapper.vm.position.left).not.equal('');
      expect(wrapper.vm.breathType).equal('breatheSuccess');
      done();
    }, 100);
  });

  it('test for win when can install update and cancel install', () => {
    mainHelper.onUpdateDownloaded(updateInfo);
    setTimeout(() => {
      expect(wrapper.vm.helper).not.equal(null);
      expect(wrapper.vm.position.left).not.equal('');
      wrapper.vm.helper.notInstall();
      setTimeout(() => {
        expect(wrapper.vm.visibility).equal('hidden');
        expect(wrapper.vm.$refs.showWindow.className).equal('updateContainerDisappear');
        done();
      }, 100);
    }, 100);
  });

  it('test for win not have previous installed update', () => {
    mainHelper.onStart();
    setTimeout(() => {
      expect(wrapper.vm.helper).not.equal(null);
      expect(wrapper.vm.position.left).equal('');
      done();
    }, 100);
  });
});

