import Vue from 'vue';
import { ipcRenderer, remote } from 'electron';
import VueI18n from 'vue-i18n';
import osLocale from 'os-locale';
import messages from '@/locales';
import { hookVue } from '@/kerning';
import { setToken } from '@/libs/apis';
import Payment from '@/components/Payment.vue';
import '@/css/style.scss';

hookVue(Vue);
Vue.use(VueI18n);

function getSystemLocale() {
  const { app } = remote;
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

new Vue({
  i18n,
  components: { Payment },
  data: {},
  mounted() {
    // sign in success
    ipcRenderer.on('sign-in', (e: Event, account?: {
      token: string, id: string,
    }) => {
      if (account) {
        setToken(account.token);
      } else {
        setToken('');
      }
    });

    // load global data when sign in is opend
    const account = remote.getGlobal('account');
    if (account && account.token) {
      setToken(account.token);
    }
  },
  template: '<Payment/>',
}).$mount('#app');
