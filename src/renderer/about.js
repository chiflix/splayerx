import Vue from 'vue';
import '@/css/style.scss';
import About from '@/components/About.vue';

new Vue({
  components: { About },
  data: {},
  template: '<About/>',
}).$mount('#app');
