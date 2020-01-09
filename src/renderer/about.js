import Vue from 'vue';
import osLocale from 'os-locale';
import VueI18n from 'vue-i18n';
import electron, { ipcRenderer } from 'electron';
import messages from '@/locales';
import { hookVue } from '@/kerning';
import About from '@/components/About.vue';
import '@/css/style.scss';


Vue.use(VueI18n);

function getSystemLocale() {
  const { app } = electron.remote;
  const locale = process.platform === 'win32' ? app.getLocale() : osLocale.sync();
  if (locale === 'zh-TW' || locale === 'zh-HK' || locale === 'zh-Hant') {
    return 'zh-Hant';
  }
  if (locale.startsWith('zh')) {
    return 'zh-Hans';
  }
  return 'en';
}

const i18n = new VueI18n({
  locale: getSystemLocale(), // set locale
  fallbackLocale: 'en',
  messages, // set locale messages
});

hookVue(Vue);
new Vue({
  i18n,
  components: { About },
  data: {},
  mounted() {
    ipcRenderer.on('setPreference', (event, data) => {
      if (data && data.displayLanguage) {
        this.$i18n.locale = data.displayLanguage;
      }
    });
  },
  template: '<About/>',
}).$mount('#app');
