import Vue from 'vue';
import Vuex from 'vuex';
import VueI18n from 'vue-i18n';
import { hookVue } from '@/kerning';
// @ts-ignore
import BrowsingPip from '@/components/BrowsingPip.vue';
import store from '@/store';

hookVue(Vue);
Vue.use(VueI18n);
Vue.use(Vuex);

Vue.prototype.$bus = new Vue(); // Global event bus
Vue.directive('fade-in', {
  bind(el: HTMLElement, binding: unknown) {
    if (!el) return;
    const { value } = binding as { value: unknown };
    if (value) {
      el.classList.add('fade-in');
      el.classList.remove('fade-out');
    } else {
      el.classList.add('fade-out');
      el.classList.remove('fade-in');
    }
  },
  update(el: HTMLElement, binding) {
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
new Vue({
  components: { BrowsingPip },
  data: {},
  store,
  template: '<BrowsingPip/>',
}).$mount('#app');
