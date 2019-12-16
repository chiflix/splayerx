import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
import { hookVue } from '@/kerning';
import messages from '@/locales';
import store from '@/store';
import '@/css/style.scss';
import { getSystemLocale } from '../shared/utils';
// @ts-ignore
import DownloadPage from '@/components/DownloadPage.vue';

Vue.use(VueI18n);
Vue.use(Vuex);
Vue.use(VueRouter);

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
