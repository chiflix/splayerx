import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
import electron from 'electron';
import osLocale from 'os-locale';
import { hookVue } from '@/kerning';
import messages from '@/locales';
import store from '@/store';
import '@/css/style.scss';
// @ts-ignore
import DownloadPage from '@/components/DownloadPage.vue';

Vue.use(VueI18n);
Vue.use(Vuex);
Vue.use(VueRouter);
Vue.directive('fade-in', {
  bind(el, binding) {
    if (!el) return;
    const { value } = binding;
    if (value) {
      el.classList.add('fade-in');
      el.classList.remove('fade-out');
    } else {
      el.classList.add('fade-out');
      el.classList.remove('fade-in');
    }
  },
  update(el, binding) {
    const { oldValue, value } = binding;
    if (oldValue !== value) {
      if (value) {
        el.classList.add('fade-in');
        el.classList.remove('fade-out');
      } else {
        el.classList.add('fade-out');
        el.classList.remove('fade-in');
      }
    }
  },
});

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
  store,
  components: { DownloadPage },
  data: {},
  template: '<DownloadPage/>',
}).$mount('#app');
