import Vue from 'vue';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueI18n from 'vue-i18n';
import messages from '@/locales';
import UpdaterNotification from '@/components/UpdaterView/UpdaterNotification.vue';
import ipcs from './ipcMock';
import { RendererHelperForWin } from '../../../../src/main/update/RendererHelper';
import MainHelper from './mainSimulator';
import Storage from '../../../../src/main/update/Updatestorage';

const storage = new Storage();
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

if (process.platform === 'win32') {
  // only do following unit test for win32
  let wrapper;
  let mainHelper;
  describe('UpdaterNotification.vue', () => {
    beforeEach(() => {
      const ipcMR = ipcs();
      wrapper = shallowMount(UpdaterNotification, options);
      wrapper.vm.helper = new RendererHelperForWin(wrapper.vm);
      wrapper.vm.helper.ipc = ipcMR.ipcRenderer;
      mainHelper = MainHelper('win32', ipcMR.ipcMain);
      wrapper.vm.helper.rendererReady(); // means render Ready
      wrapper.vm.helper.registerListener();
    });
    it('loaded correct', () => {
      expect(wrapper.vm.helper).not.equal(null);
      expect(wrapper.vm.content).equal('');
      expect(wrapper.vm.containerStyle.platform).equal('');
      expect(wrapper.vm.buttons).eql([]);
      expect(wrapper.vm.linkProp['webkit-animation-name']).equal(null);
    });
    it('test for win downloaded update for the first use', (done) => {
      storage.clearPreviousDownload()
        .then(() => mainHelper.onUpdateDownloaded(updateInfoNext)).then(() => {
          setTimeout(() => {
            expect(wrapper.vm.helper).not.equal(null);
            expect(wrapper.vm.containerStyle.platform).equal('');
            done();
          }, 300);
        });
    });
    it('for win when can install after first use update and user choose to install test', (done) => {
      // const { mainHelper, wrapper } = getWrapper();
      mainHelper.onUpdateDownloaded(updateInfo).then(() => {
        setTimeout(() => {
          expect(wrapper.vm.helper).not.equal(null);
          expect(wrapper.vm.visibility).not.equal('hidden');
          expect(wrapper.vm.containerStyle.platform).equal('win32');
          expect(wrapper.vm.breathType).equal('breatheAlert');
          wrapper.vm.helper.install();
          done();
        }, 300);
      });
    });
    it('test for win to notify user that it has installed update', (done) => {
      mainHelper.onStart();
      setTimeout(() => {
        expect(wrapper.vm.helper).not.equal(null);
        expect(wrapper.vm.containerStyle.platform).equal('win32');
        expect(wrapper.vm.breathType).equal('breatheSuccess');
        done();
      }, 300);
    });
    it('test for win in the round after the round in which has notified user tha it has installed update', (done) => {
      mainHelper.onStart();
      setTimeout(() => {
        expect(wrapper.vm.helper).not.equal(null);
        expect(wrapper.vm.containerStyle.platform).equal('');
        expect(wrapper.vm.visibility).equal('hidden');
        done();
      }, 300);
    });
    it('test for win when can install update and cancel install', (done) => {
      mainHelper.onUpdateDownloaded(updateInfo);
      setTimeout(() => {
        expect(wrapper.vm.helper).not.equal(null);
        expect(wrapper.vm.containerStyle.platform).equal('win32');
        wrapper.vm.helper.notInstall();
        setTimeout(() => {
          expect(wrapper.vm.visibility).equal('hidden');
          expect(wrapper.vm.$refs.showWindow.className).equal('updateContainerDisappear');
          done();
        }, 300);
      }, 300);
    });
    it('test for win not have previous installed update', (done) => {
      mainHelper.onStart();
      setTimeout(() => {
        expect(wrapper.vm.helper).not.equal(null);
        expect(wrapper.vm.containerStyle.platform).equal('');
        done();
      }, 300);
    });
  });
}
