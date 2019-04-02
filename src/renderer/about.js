import Vue from 'vue';
import { hookVue } from '@/kerning';
import About from '@/components/About.vue';
import '@/css/style.scss';

hookVue(Vue);

new Vue({
  components: { About },
  data: {},
  template: '<About/>',
}).$mount('#app');
