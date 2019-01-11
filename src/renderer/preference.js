import Vue from 'vue';
import '@/css/style.scss';
import Preference from '@/components/Preference.vue';

new Vue({
  components: { Preference },
  data: {},
  template: '<Preference/>',
}).$mount('#app');
