import Vue from 'vue';
import Vuex, { mapActions, mapGetters } from 'vuex';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
import { hookVue } from '@/kerning';
import store from '@/store/webStore';
import messages from '@/locales';
import {
  setToken, getGeoIP, getUserInfo,
} from '@/libs/webApis';
// @ts-ignore
import Product from '@/containers/Premium/Product.vue';
import {
  UserInfo as uActions,
} from '@/store/actionTypes';
import '@/css/style.scss';
import { PayStatus } from '@/store/modules/UserInfo';

Vue.use(VueI18n);
Vue.use(Vuex);


Vue.use(VueRouter);

Vue.directive('fade-in', {
  bind(el: HTMLElement, binding: any) { // eslint-disable-line
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

const routeMap = {
  account: 'Account',
  premium: 'Premium',
  points: 'Points',
};

const routes = [
  {
    path: '*',
    redirect: '/',
  },
  {
    path: '/',
    name: 'Premium',
    component: require('@/containers/Premium/Premium.vue').default,
  },
  {
    path: '/points',
    name: 'Points',
    component: require('@/containers/Premium/Points.vue').default,
  },
  {
    path: '/account',
    name: 'Account',
    component: require('@/containers/Account/Account.vue').default,
  },
];

const router = new VueRouter({
  routes,
});

const i18n = new VueI18n({
  // @ts-ignore
  locale: window.displayLanguage, // set locale
  fallbackLocale: 'en',
  messages, // set locale messages
});

hookVue(Vue);

new Vue({
  i18n,
  router,
  store,
  components: { Product },
  data: {
    didGetUserInfo: false,
  },
  computed: {
    ...mapGetters([
      'signInCallback',
    ]),
  },
  mounted() {
    // @ts-ignore
    window.ipcRenderer && window.ipcRenderer.on('setPreference', (event: Event, data: {
      displayLanguage: string,
    }) => {
      if (data && data.displayLanguage) {
        this.$i18n.locale = data.displayLanguage;
      }
    });
    try {
      // @ts-ignore
      const userInfo = window.remote && window.remote.getGlobal('account');
      this.updateUserInfo(userInfo);
      if (userInfo && userInfo.token) {
        this.updateToken(userInfo.token);
        setToken(userInfo.token);
        this.getUserInfo();
      }
    } catch (error) {
      // empty
    }
    getGeoIP().then((res: {
      countryCode: string,
    }) => {
      this.updateCountryCode(res.countryCode);
    }).catch(() => {
      // empty
    });
    // @ts-ignore
    const ipcRenderer = window.ipcRenderer;
    if (ipcRenderer) {
      ipcRenderer.on('premium-route-change', (e: Event, route: string) => {
        route = route || 'premium';
        const currentRoute = this.$router.currentRoute;
        if (currentRoute && currentRoute.name === routeMap[route]) return;
        if (routeMap[route]) {
          this.$router.push({ name: routeMap[route] });
        }
      });
      // sign in success
      ipcRenderer.on('sign-in', (e: Event, account: {
        token: string,
      }) => {
        this.updateUserInfo(account);
        if (account && account.token) {
          this.updateToken(account.token);
          setToken(account.token);
          this.getUserInfo();
          // sign in success, callback
          if (this.signInCallback) {
            this.signInCallback();
            this.updateSignInCallBack(() => { });
          }
        } else {
          this.token = '';
          setToken('');
          this.updateToken('');
          this.didGetUserInfo = false;
        }
      });
      ipcRenderer.on('close-payment', () => {
        this.updatePayStatus(PayStatus.Default);
      });
      ipcRenderer.on('applePay-success', () => {
        this.isPaying = false;
        this.isPaySuccess = true;
        this.isPayFail = false;
        ipcRenderer && ipcRenderer.send('create-order-done');
      });
      ipcRenderer.on('applePay-fail', () => {
        this.isPaying = false;
        this.isPaySuccess = false;
        this.isPayFail = true;
        ipcRenderer && ipcRenderer.send('create-order-done');
      });
      ipcRenderer.on('payment-success', () => {
        setTimeout(() => {
          this.isPaying = false;
          this.isPaySuccess = true;
          this.isPayFail = false;
        }, 800);
        // update userInfo
      });
      ipcRenderer.on('payment-fail', () => {
        this.isPaying = false;
        this.isPaySuccess = false;
        this.isPayFail = true;
      });
    }
  },
  methods: {
    ...mapActions({
      updateToken: uActions.UPDATE_USER_TOKEN,
      updateUserInfo: uActions.UPDATE_USER_INFO,
      updateCountryCode: uActions.UPDATE_COUNTRY_CODE,
      updateSignInCallBack: uActions.UPDATE_SIGN_IN_CALLBACK,
      updatePayStatus: uActions.UPDATE_PAY_STATUS,
    }),
    async getUserInfo() {
      if (this.didGetUserInfo) return;
      this.didGetUserInfo = true;
      try {
        const res = await getUserInfo();
        this.updateUserInfo(res.me);
      } catch (error) {
        // empty
        this.didGetUserInfo = false;
      }
    },
  },
  template: '<Product/>',
}).$mount('#app');
