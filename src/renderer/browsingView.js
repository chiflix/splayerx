import Vue from 'vue';
import { hookVue } from '@/kerning';
import BrowsingView from '@/components/BrowsingView.vue';
import store from '@/store';
import helpers from '@/helpers';
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
Vue.mixin(helpers);

function getSystemLocale() {
  const { app } = electron.remote;
  const locale = process.platform === 'win32' ? app.getLocale() : osLocale.sync();
  if (locale === 'zh-TW') {
    return 'zhTW';
  } if (locale.startsWith('zh')) {
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
  mounted() {
    this.$store.commit('getLocalPreference');
    window.addEventListener('keydown', (e) => {
      if (e.metaKey && e.shiftKey && e.key === 'u') {
        this.$bus.$emit('open-url-show', true);
      }
    });
  },
  template: '<BrowsingView/>',
}).$mount('#app');
