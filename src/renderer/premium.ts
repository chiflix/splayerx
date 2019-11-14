import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
import { hookVue } from '@/kerning';
import messages from '@/locales';
// @ts-ignore
import Product from '@/containers/Premium/Product.vue';
import '@/css/style.scss';

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

const routes = [
  {
    path: '*',
    redirect: '/',
  },
  {
    path: '/',
    name: 'premium',
    component: require('@/containers/Premium/Premium.vue').default,
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
  components: { Product },
  data: {},
  mounted() {
    // @ts-ignore
    window.ipcRenderer && window.ipcRenderer.on('setPreference', (event: Event, data: {
      displayLanguage: string,
    }) => {
      if (data && data.displayLanguage) {
        this.$i18n.locale = data.displayLanguage;
      }
    });
  },
  template: '<Product/>',
}).$mount('#app');
