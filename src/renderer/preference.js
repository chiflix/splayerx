import Vue from 'vue';
import Vuex from 'vuex';
import VueI18n from 'vue-i18n';
import electron from 'electron';
import osLocale from 'os-locale';
import { hookVue } from '@/kerning';
import messages from '@/locales';
import Preference from '@/components/Preference.vue';
import preference from '@/store/modules/Preference';
import '@/css/style.scss';

Vue.use(VueI18n);
Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    preference,
  },
  strict: process.env.NODE_ENV !== 'production',
});

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

hookVue(Vue);

new Vue({
  i18n,
  components: { Preference },
  data: {},
  store,
  template: '<Preference/>',
  mounted() {
    this.$store.commit('getLocalPreference');
  },
}).$mount('#app');
