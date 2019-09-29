import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
import VueAxios from 'vue-axios';
import electron from 'electron';
import osLocale from 'os-locale';
import { hookVue } from '@/kerning';
import messages from '@/locales';
import store from '@/store';
// @ts-ignore
import Login from '@/containers/Login/Login.vue';
import '@/css/style.scss';

Vue.use(VueI18n);
Vue.use(Vuex);
Vue.use(VueRouter);
Vue.use(VueAxios, axios);

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

const routes = [
  {
    path: '*',
    redirect: '/',
  },
  {
    path: '/',
    name: 'sms',
    component: require('@/containers/Login/SMS.vue').default,
  },
];

const router = new VueRouter({
  routes,
});

const i18n = new VueI18n({
  locale: getSystemLocale(), // set locale
  fallbackLocale: 'en',
  messages, // set locale messages
});

hookVue(Vue);

new Vue({
  i18n,
  router,
  components: { Login },
  data: {},
  store,
  mounted() {
    this.$store.commit('getLocalPreference');
  },
  template: '<Login/>',
}).$mount('#app');
