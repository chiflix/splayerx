import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
import * as Sentry from '@sentry/browser';
import { Vue as VueIntegration } from '@sentry/integrations';
import { hookVue } from '@/kerning';
import messages from '@/locales';
// @ts-ignore
import Login from '@/containers/Login/Login.vue';
import '@/css/style.scss';
import { getSystemLocale } from '@/../shared/utils';

Vue.use(VueI18n);
Vue.use(Vuex);
Vue.use(VueRouter);

Vue.prototype.logSave = () => { };
if (Sentry) {
  Sentry.init({
    dsn: 'https://6a94feb674b54686a6d88d7278727b7c@sentry.io/1449341',
    // @ts-ignore
    integrations: [new VueIntegration({ Vue, attachProps: true })],// eslint-disable-line
  });
  // save server error to sentry
  Vue.prototype.logSave = (error: object) => {
    Sentry.withScope((scope: any) => { // eslint-disable-line
      Object.keys(error).forEach((key: string) => {
        scope.setExtra(key, error[key]);
      });
      Sentry.captureMessage('server-call-error');
    });
  };
}
const routes = [
  {
    path: '/sms',
    name: 'sms',
    component: require('@/containers/Login/SMS.vue').default,
  },
  {
    path: '*',
    redirect: '/sms',
  },
];

const router = new VueRouter({
  routes,
});

const i18n = new VueI18n({
  // @ts-ignore
  locale: window.displayLanguage || getSystemLocale(), // set locale
  fallbackLocale: 'en',
  messages, // set locale messages
});

hookVue(Vue);

new Vue({
  i18n,
  router,
  components: { Login },
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
  template: '<Login/>',
}).$mount('#app');
