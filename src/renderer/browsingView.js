import Vue from 'vue';
import VueYoutube from 'vue-youtube';
import { hookVue } from '@/kerning';
import BrowsingView from '@/components/BrowsingView.vue';
import '@/css/style.scss';

Vue.use(VueYoutube);
hookVue(Vue);

new Vue({
  components: { BrowsingView },
  data: {},
  template: '<BrowsingView/>',
}).$mount('#app');
