import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
import electron from 'electron';
import osLocale from 'os-locale';
import { hookVue } from '@/kerning';
import messages from '@/locales';
import store from '@/store';
import Preference from '@/components/Preference.vue';
import '@/css/style.scss';

Vue.use(VueI18n);
Vue.use(Vuex);
Vue.use(VueRouter);

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
    name: 'General',
    component: require('@/components/Preferences/General.vue').default,
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: require('@/components/Preferences/Privacy.vue').default,
  },
  {
    path: '/translate',
    name: 'Translate',
    component: require('@/components/Preferences/Translate.vue').default,
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
  components: { Preference },
  data: {},
  store,
  mounted() {
    this.$store.commit('getLocalPreference');
  },
  template: '<Preference/>',
}).$mount('#app');
