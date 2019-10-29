import Vue from 'vue';
import Vuex, { mapActions } from 'vuex';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
import electron, { ipcRenderer, remote } from 'electron';
import osLocale from 'os-locale';
import { hookVue } from '@/kerning';
import messages from '@/locales';
import store from '@/store';
import Preference from '@/components/Preference.vue';
import {
  UserInfo as uActions,
} from '@/store/actionTypes';
import '@/css/style.scss';
import {
  getUserInfo, getProductList, setToken, getGeoIP,
} from '@/libs/apis';

Vue.use(VueI18n);
Vue.use(Vuex);
Vue.use(VueRouter);
Vue.directive('fade-in', {
  bind(el, binding) {
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
  {
    path: '/account',
    name: 'Account',
    component: require('@/components/Preferences/Account.vue').default,
  },
  {
    path: '/premium',
    name: 'Premium',
    component: require('@/components/Preferences/Premium.vue').default,
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
  data: {
    didGetUserInfo: false,
  },
  store,
  async mounted() {
    this.$store.commit('getLocalPreference');
    // sign in success
    ipcRenderer.on('sign-in', (e, account) => {
      this.updateUserInfo(account);
      if (account) {
        setToken(account.token);
        this.updateToken(account.token);
        this.getUserInfo();
      } else {
        setToken('');
        this.updateToken('');
        this.didGetUserInfo = false;
      }
    });

    ipcRenderer.on('route-account', () => {
      this.$router.push({ name: 'Account' });
    });

    // load global data when sign in is opend
    const account = remote.getGlobal('account');
    this.updateUserInfo(account);
    if (account && account.token) {
      this.updateToken(account.token);
      setToken(account.token);
      this.getUserInfo();
    }

    getGeoIP().then((res) => {
      this.$store.dispatch('updateGeo', res);
    }).catch(() => {
      // empty
    });
    // get products
    try {
      const productList = await getProductList();
      this.updatePremiumList(productList);
    } catch (error) {
      // empty
    }
  },
  methods: {
    ...mapActions({
      updateUserInfo: uActions.UPDATE_USER_INFO,
      updateToken: uActions.UPDATE_USER_TOKEN,
      updatePremiumList: uActions.UPDATE_PREMIUM,
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
  template: '<Preference/>',
}).$mount('#app');
