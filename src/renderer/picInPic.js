import Vue from 'vue';
import VueYoutube from 'vue-youtube';
import { hookVue } from '@/kerning';
import picInPic from '@/components/PicInPic.vue';
import '@/css/style.scss';

Vue.use(VueYoutube);
hookVue(Vue);

new Vue({
  components: { picInPic },
  data: {},
  template: '<picInPic/>',
}).$mount('#app');
