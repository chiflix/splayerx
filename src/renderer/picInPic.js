import Vue from 'vue';
import { hookVue } from '@/kerning';
import picInPic from '@/components/PicInPic.vue';
import '@/css/style.scss';

hookVue(Vue);

new Vue({
  components: { picInPic },
  data: {},
  template: '<picInPic/>',
}).$mount('#app');
