import Vue from 'vue';
import { hookVue } from '@/kerning';
import BrowsingView from '@/components/BrowsingView.vue';
import store from '@/store';
import '@/css/style.scss';
import electron from 'electron';
import osLocale from 'os-locale';
import VueI18n from 'vue-i18n';
import messages from '@/locales';
import Vuex from 'vuex';

hookVue(Vue);
Vue.use(VueI18n);
Vue.use(Vuex);
Vue.prototype.$bus = new Vue(); // Global event bus

function getSystemLocale() {
  const { app } = electron.remote;
  const locale = process.platform === 'win32' ? app.getLocale() : osLocale.sync();
  if (locale === 'zh-TW') {
    return 'zhTW';
  } else if (locale.startsWith('zh')) {
    return 'zhCN';
  }
  return 'en';
}
const i18n = new VueI18n({
  locale: getSystemLocale(), // set locale
  messages, // set locale messages
});

new Vue({
  i18n,
  components: { BrowsingView },
  data: {},
  store,
  template: '<BrowsingView/>',
  mounted() {
    this.$store.commit('getLocalPreference');
  },
}).$mount('#app');
