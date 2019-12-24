import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
import { hookVue } from '@/kerning';
import messages from '@/locales';
import store from '@/store';
import '@/css/style.scss';
// @ts-ignore
import DownloadList from './DownloadList.vue';

Vue.use(VueI18n);
Vue.use(Vuex);
Vue.use(VueRouter);

const i18n = new VueI18n({
  // @ts-ignore
  locale: window.displayLanguage, // set locale
  fallbackLocale: 'en',
  messages, // set locale messages
});

hookVue(Vue);
new Vue({
  i18n,
  store,
  components: { DownloadList },
  data: {},
  mounted() {
    // @ts-ignore
    window.ipcRenderer.on('setPreference', (event: Event, data: {
      displayLanguage: string,
    }) => {
      if (data && data.displayLanguage) {
        this.$i18n.locale = data.displayLanguage;
      }
    });
  },
  template: '<DownloadList/>',
}).$mount('#app');
